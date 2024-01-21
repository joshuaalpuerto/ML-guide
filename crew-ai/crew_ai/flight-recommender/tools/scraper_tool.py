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


class Scraper(BaseTool):
    name = "website_scrapper"
    description = dedent(
        """Scrape websites for to get additional information. Only use this tools if there are links available to script. Remember for ActionInput you must extract all the links mentioned in the provided context and format them into a valid comma-separated string."""
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

        # Grab the first 2000 tokens of the site
        splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=300)
        splits = splitter.split_documents(docs_transformed)
        summaries = []
        for doc in splits:
            agent = Agent(
                role="Principal Researcher",
                goal="Do amazing researches and summaries based on the content you are working with. You don't need to use any tool. Just use the content you have.",
                backstory="You're a Principal Researcher at a big company and you need to do a research about a given topic.",
                allow_delegation=False,
                llm=self.llm,
            )
            task = Task(
                agent=agent,
                description=f"Analyze and summarize the content bellow, make sure to include the most relevant information in the summary to provide the best experience for the traveler, return only the summary nothing else.\n\nCONTENT\n----------\n{doc.page_content}",
            )
            summary = task.execute()
            summaries.append(summary)
        return "\n\n".join(summaries)
