import json
import uuid

import pytest

from src.pipelines.ask import (
    generation_pipeline,
    indexing_pipeline,
    retrieval_pipeline,
)
from src.pipelines.ask.components.document_store import init_document_store
from src.pipelines.ask.components.embedder import init_embedder
from src.pipelines.ask.components.generator import init_generator
from src.pipelines.ask.components.prompts import init_generation_prompt_builder
from src.pipelines.ask.components.retriever import init_retriever
from src.pipelines.ask.indexing_pipeline import Indexing
from src.web.v1.services.ask import (
    AskRequest,
    AskResultRequest,
    AskService,
    SemanticsPreparationRequest,
)


@pytest.fixture
def ask_service():
    document_store = init_document_store()
    embedder = init_embedder()
    retriever = init_retriever(document_store=document_store)
    generator = init_generator()
    generation_prompt_builder = init_generation_prompt_builder()

    return AskService(
        {
            "indexing": indexing_pipeline.Indexing(
                document_store=document_store,
            ),
            "retrieval": retrieval_pipeline.Retrieval(
                embedder=embedder,
                retriever=retriever,
            ),
            "generation": generation_pipeline.Generation(
                generator=generator,
                prompt_builder=generation_prompt_builder,
            ),
        }
    )


@pytest.fixture
def mdl_str():
    with open("tests/data/book_2_mdl.json", "r") as f:
        return json.dumps(json.load(f))


def test_indexing_pipeline(mdl_str: str):
    document_store = init_document_store(dataset_name="book_2")
    indexing_pipeline = Indexing(
        document_store=document_store,
    )

    indexing_pipeline.run(mdl_str)
    assert document_store.count_documents() == 2


def test_ask_with_easy_query(ask_service: AskService, mdl_str: str):
    id = str(uuid.uuid4())
    ask_service.prepare_semantics(
        SemanticsPreparationRequest(
            mdl=mdl_str,
            id=id,
        )
    )

    # asking
    query_id = str(uuid.uuid4())
    ask_request = AskRequest(
        query="How many books are there?'",
        id=id,
    )
    ask_request.query_id = query_id
    ask_service.ask(ask_request)

    # getting ask result
    ask_result_response = ask_service.get_ask_result(
        AskResultRequest(
            query_id=query_id,
        )
    )

    # from Pao Sheng: I think it has a potential risk if a dangling status case happens.
    # maybe we could consider adding an approach that if over a time limit,
    # the process will throw an exception.
    while (
        ask_result_response.status != "finished"
        and ask_result_response.status != "failed"
    ):
        ask_result_response = ask_service.get_ask_result(
            AskResultRequest(
                query_id=query_id,
            )
        )

    if ask_result_response.status == "finished":
        assert ask_result_response.response is not None
        assert len(ask_result_response.response) == 3
        assert ask_result_response.response[0].sql != ""
        assert ask_result_response.response[0].summary != ""
    else:
        assert ask_result_response.status == "failed"
        assert ask_result_response.error != ""