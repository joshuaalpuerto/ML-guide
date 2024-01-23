import json
import os

import requests
from typing import Any
from crewai import Agent, Task
from langchain.tools import BaseTool
from textwrap import dedent
from langchain_community.document_loaders import AsyncChromiumLoader
from langchain_community.document_transformers import Html2TextTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.summarize import load_summarize_chain
from langchain.prompts import PromptTemplate
import logging


class Scraper(BaseTool):
    name = "website_scrapper"
    description = dedent(
        """Scrape websites to get additional information. Remember to pass only all links formatted in a valid comma-separated string. 
        
        ActionInput: should have all links mentioned in the provided  context and formatted to valid comma-separated string."""
    )
    return_direct = True

    # improve the typing for this
    llm: Any

    def __init__(self, llm, **kwargs):
        super().__init__(**kwargs)
        self.llm = llm

    def _run(self, input_string):
        urls = [url.strip() for url in input_string.split(",")]
        loader = AsyncChromiumLoader(urls)
        docs = loader.load()
        html2text = Html2TextTransformer()
        docs_transformed = html2text.transform_documents(docs)

        splitter = RecursiveCharacterTextSplitter(chunk_size=8000, chunk_overlap=1000)
        splits = splitter.split_documents(docs_transformed)

        logging.info(f"""Sources: {input_string}, total splits: {len(splits)}""")

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
        result = chain({"input_documents": splits}, return_only_outputs=True)

        return dedent(
            f"""
            {result["output_text"]}

            Sources: {input_string}
            """
        )
