# mypy: disable - error - code = "no-untyped-def,misc"
import pathlib
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
import fastapi.exceptions
from pydantic import BaseModel

from agent.configuration import Configuration

# Define the FastAPI app
app = FastAPI()

# Pydantic model for the LLM configuration response
class LlmConfigResponse(BaseModel):
    llm_provider: str
    gemini_query_generator_model: str
    gemini_reflection_model: str
    gemini_answer_model: str
    deepseek_query_generator_model: str
    deepseek_reflection_model: str
    deepseek_answer_model: str

@app.get("/api/llm-config", response_model=LlmConfigResponse)
async def get_llm_config():
    """Returns the current LLM configuration."""
    config = Configuration()
    return LlmConfigResponse(
        llm_provider=config.llm_provider,
        gemini_query_generator_model=config.query_generator_model, # Note: field name mismatch from Configuration
        gemini_reflection_model=config.reflection_model, # Note: field name mismatch from Configuration
        gemini_answer_model=config.answer_model, # Note: field name mismatch from Configuration
        deepseek_query_generator_model=config.deepseek_query_generator_model,
        deepseek_reflection_model=config.deepseek_reflection_model,
        deepseek_answer_model=config.deepseek_answer_model,
    )


def create_frontend_router(build_dir="../frontend/dist"):
    """Creates a router to serve the React frontend.

    Args:
        build_dir: Path to the React build directory relative to this file.

    Returns:
        A Starlette application serving the frontend.
    """
    build_path = pathlib.Path(__file__).parent.parent.parent / build_dir
    static_files_path = build_path / "assets"  # Vite uses 'assets' subdir

    if not build_path.is_dir() or not (build_path / "index.html").is_file():
        print(
            f"WARN: Frontend build directory not found or incomplete at {build_path}. Serving frontend will likely fail."
        )
        # Return a dummy router if build isn't ready
        from starlette.routing import Route

        async def dummy_frontend(request):
            return Response(
                "Frontend not built. Run 'npm run build' in the frontend directory.",
                media_type="text/plain",
                status_code=503,
            )

        return Route("/{path:path}", endpoint=dummy_frontend)

    build_dir = pathlib.Path(build_dir)

    react = FastAPI(openapi_url="")
    react.mount(
        "/assets", StaticFiles(directory=static_files_path), name="static_assets"
    )

    @react.get("/{path:path}")
    async def handle_catch_all(request: Request, path: str):
        fp = build_path / path
        if not fp.exists() or not fp.is_file():
            fp = build_path / "index.html"
        return fastapi.responses.FileResponse(fp)

    return react


# Mount the frontend under /app to not conflict with the LangGraph API routes
app.mount(
    "/app",
    create_frontend_router(),
    name="frontend",
)
