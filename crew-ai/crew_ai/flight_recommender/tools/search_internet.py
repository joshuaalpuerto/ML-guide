from typing import Any
from langchain.tools import BaseTool
from textwrap import dedent
from langchain_community.document_loaders import AsyncChromiumLoader
from langchain_community.document_transformers import Html2TextTransformer
from langchain_community.utilities import SerpAPIWrapper
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.summarize import load_summarize_chain
from langchain.prompts import PromptTemplate
from langchain_exa import ExaSearchRetriever, TextContentsOptions
import logging
import re
from crew_ai.config import config


class WebLoader:
    def scrape_website_links(self, links, chunk_size=8000, chunk_overlap=1000):
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


class SerpAPI:
    def __init__(self):
        self.web_loader = WebLoader()

    def search(self, query):
        search_tool = SerpAPIWrapper(
            serpapi_api_key=config.SERPAPI_API_KEY,
            params={
                "engine": "google",
                "google_domain": "google.com",
                "gl": "ee",  # should come from arguments for now we will statically add here Estonia
                "hl": "en",
            },
        )
        return search_tool.results(
            query,
        )

    def get_documents_from_query(self, query):
        results = self.search(query)
        # get organic results and return only top 2
        organic_results = results["organic_results"][:2]

        links = [result["link"] for result in organic_results]

        return (links, self.web_loader.scrape_website_links(links))


class DDG:
    def __init__(self):
        self.web_loader = WebLoader()

    def search(self, query):
        """
        implement here ddg searching
        """
        pass

    def get_documents_from_query(self, query):
        results = self.search(query)
        # If Duck duck search is used we can use this to extract the links attached to the result
        # Regular expression to extract links
        links = re.findall(r"link:\s(https?://\S+)", results)

        # Define the translation table to remove specified characters
        # Sometime llm wrap te string with  [], <> lets remove it
        translation_table = str.maketrans("", "", "[]<>,")
        # Apply the translation to remove the specified characters
        links = [link.translate(translation_table) for link in links]

        return (links, self.web_loader.scrape_website_links(links))


class Exa:
    def get_documents_from_query(self, query):
        # retrieve 5 documents, with content truncated at 1000 characters
        retriever = ExaSearchRetriever(
            k=5,
            text_contents_options=TextContentsOptions(max_length=2000),
            exa_api_key=config.EXA_API_KEY,
        )
        results = retriever.invoke(query)
        links = [result.metadata["url"] for result in results]
        return (links, results)


class SearchInternet(BaseTool):
    name = "Get destination informations"
    description = dedent(
        """Tool that search internet for latest information about the destination. Input should be a search query"""
    )
    return_direct = True

    # improve the typing for this
    llm: Any
    search_engine: Any

    def __init__(self, llm, **kwargs):
        super().__init__(**kwargs)
        self.llm = llm
        self.search_engine = Exa()

    def _run(self, query):
        (links, splits) = self.search_engine.get_documents_from_query(query)
        result = self.summarize_documents(splits)

        return dedent(
            f"""{result["output_text"]}\n
            Sources: {",".join(links)}"""
        )

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
