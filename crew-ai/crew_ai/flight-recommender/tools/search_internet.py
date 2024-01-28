from typing import Any
from langchain.tools import BaseTool
from textwrap import dedent
from langchain_community.document_loaders import AsyncChromiumLoader
from langchain_community.document_transformers import Html2TextTransformer
from langchain_community.tools.ddg_search.tool import DuckDuckGoSearchResults
from langchain_community.utilities.duckduckgo_search import DuckDuckGoSearchAPIWrapper
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.summarize import load_summarize_chain
from langchain.prompts import PromptTemplate
import logging
import re


class SearchInternet(BaseTool):
    name = "Get destination informations"
    description = dedent(
        """Tool that search internet for latest information about the destination. Input should be a search query"""
    )
    return_direct = True

    # improve the typing for this
    llm: Any

    def __init__(self, llm, **kwargs):
        super().__init__(**kwargs)
        self.llm = llm

    def _run(self, query):
        search_result = self.search_information(query)
        extracted_links = self.extract_valid_links_from_search_result(search_result)
        splits = self.process_search_result_to_documents(links=extracted_links)
        result = self.summarize_documents(splits)

        return dedent(
            f"""{result["output_text"]}\n
            Sources: {",".join(extracted_links)}"""
        )

    def search_information(self, query):
        """
        The `search_information` method in the `SearchInternet` class is using the
        DuckDuckGoSearchResults tool to search the internet for information based on a given query.
        It returns the search results.
        """

        search_tool = DuckDuckGoSearchResults(num_results=2)
        return search_tool.run(
            query,
        )

    def extract_valid_links_from_search_result(self, search_result):
        # Regular expression to extract links
        links = re.findall(r"link:\s(https?://\S+)", search_result)

        # Define the translation table to remove specified characters
        # Sometime llm wrap te string with  [], <> lets remove it
        translation_table = str.maketrans("", "", "[]<>,")
        # Apply the translation to remove the specified characters
        return [link.translate(translation_table) for link in links]

    def process_search_result_to_documents(
        self, links, chunk_size=8000, chunk_overlap=1000
    ):
        loader = AsyncChromiumLoader(links)
        docs = loader.load()
        html2text = Html2TextTransformer()
        docs_transformed = html2text.transform_documents(docs)

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )
        splits = splitter.split_documents(docs_transformed)

        logging.info(f"""Sources: {",".join(links)}, total splits: {len(splits)}""")

        return splits

    def summarize_documents(self, splits):
        prompt_template = """Analyze and summarize the content below, make sure to include the most relevant information to provide the best experience for the traveler, return only the summary nothing else.:
        {text}
        DETAILED SUMMARY:"""
        prompt = PromptTemplate.from_template(prompt_template)

        refine_template = (
            "Your job is to produce a final summary\n"
            "We have provided an existing summary up to a certain point: {existing_answer}\n"
            "We have the opportunity to refine the existing summary"
            "(only if needed) with some more context below.\n"
            "------------\n"
            "{text}\n"
            "------------\n"
            "Given the new context, refine the original summary to provide a thorough overview of what the city has to offer, including hidden gems, cultural"
            "hotspots, must-visit landmarks, weather forecasts, and high level costs."
        )
        refine_prompt = PromptTemplate.from_template(refine_template)
        chain = load_summarize_chain(
            llm=self.llm,
            chain_type="refine",
            question_prompt=prompt,
            refine_prompt=refine_prompt,
            return_intermediate_steps=True,
            input_key="input_documents",
            output_key="output_text",
        )
        return chain({"input_documents": splits}, return_only_outputs=True)

        return
