# Testing Plan: LLM Provider Integration

## Important: Verifying Backend Startup

Before running UI or API tests, always ensure the backend server starts without errors:

1.  Navigate to the `backend` directory.
2.  Run the command to start the backend server (e.g., `make dev` or your project's specific command).
3.  **Check the console output carefully for any error messages, especially `ImportError`s.**
4.  Confirm you see a message like `Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)`.

If the backend fails to start, subsequent tests will also fail. Address backend startup errors first.

---

**Objective:** Verify that the LLM provider and model selection works correctly in the frontend and is respected by the backend.

**Prerequisites:**
1.  Ensure the application (both frontend and backend) is built and running.
2.  Have access to `.env` file (or equivalent mechanism for setting environment variables) in the `backend` directory.
3.  Valid API keys for both Gemini and DeepSeek should be available if testing actual LLM calls. If not, UI and configuration loading can still be tested.

---

**Test Case 1: Gemini Configuration**

1.  **Setup**:
    *   In `backend/.env`, set `LLM_PROVIDER="gemini"`.
    *   Ensure `GEMINI_API_KEY` is set with a valid key.
    *   Ensure Gemini model names are correctly set, for example:
        *   `QUERY_GENERATOR_MODEL="gemini-1.5-flash-latest"` (or any valid query generation model)
        *   `REFLECTION_MODEL="gemini-1.5-flash-latest"` (or any valid reflection model)
        *   `ANSWER_MODEL="gemini-1.5-pro-latest"` (or any valid answer generation model)

2.  **Execution**:
    *   Start/Restart the backend application to load the environment variables.
    *   Open the application in a web browser (usually at the frontend development server URL).
    *   Observe the "Model" selection dropdown in the input form.

3.  **Expected Results**:
    *   The label next to "Model" should display "(Gemini)".
    *   The dropdown should list only Gemini models with labels like "Query Gen (Gemini)", "Reflection (Gemini)", "Answer Gen (Gemini)".
    *   The "Query Gen (Gemini)" model should be pre-selected by default.
    *   **(Optional, if API keys are valid)** Attempt a search query. The search should complete successfully. If backend logs are accessible, they should indicate that Gemini models were used for query generation, reflection, and final answer generation.

---

**Test Case 2: DeepSeek Configuration**

1.  **Setup**:
    *   In `backend/.env`, set `LLM_PROVIDER="deepseek"`.
    *   Ensure `DEEPSEEK_API_KEY` is set with a valid key.
    *   Ensure DeepSeek model names are correctly set, for example:
        *   `DEEPSEEK_QUERY_GENERATOR_MODEL="deepseek-chat"`
        *   `DEEPSEEK_REFLECTION_MODEL="deepseek-chat"`
        *   `DEEPSEEK_ANSWER_MODEL="deepseek-chat"`
    *   Ensure `GEMINI_API_KEY` is still set (as it's used for the Google Search functionality).

2.  **Execution**:
    *   Restart the backend application to ensure it picks up the new environment variable values.
    *   Refresh the application in the web browser.
    *   Observe the "Model" selection dropdown in the input form.

3.  **Expected Results**:
    *   The label next to "Model" should display "(Deepseek)".
    *   The dropdown should list only DeepSeek models with labels like "Query Gen (DeepSeek)", "Reflection (DeepSeek)", "Answer Gen (DeepSeek)".
    *   The "Query Gen (DeepSeek)" model should be pre-selected by default.
    *   **(Optional, if API keys are valid)** Attempt a search query. The search should complete successfully. If backend logs are accessible, they should indicate that DeepSeek models were used for query generation, reflection, and final answer generation (while Google Search via Gemini was used for web research).

---

**Test Case 3: API Endpoint Verification (Technical Test)**

1.  **Setup**:
    *   Ensure the backend application is running.
    *   Configure `backend/.env` with any desired combination of `LLM_PROVIDER` and model names.

2.  **Execution**:
    *   Navigate directly to the `/api/llm-config` endpoint in a web browser (e.g., `http://localhost:8000/api/llm-config` if your backend runs on port 8000) or use a tool like `curl`.

3.  **Expected Results**:
    *   The browser or tool should display a JSON response.
    *   The JSON should contain:
        *   `llm_provider`: Matching the value in `.env`.
        *   `gemini_query_generator_model`: Matching the `QUERY_GENERATOR_MODEL` from `.env`.
        *   `gemini_reflection_model`: Matching the `REFLECTION_MODEL` from `.env`.
        *   `gemini_answer_model`: Matching the `ANSWER_MODEL` from `.env`.
        *   `deepseek_query_generator_model`: Matching `DEEPSEEK_QUERY_GENERATOR_MODEL` from `.env`.
        *   `deepseek_reflection_model`: Matching `DEEPSEEK_REFLECTION_MODEL` from `.env`.
        *   `deepseek_answer_model`: Matching `DEEPSEEK_ANSWER_MODEL` from `.env`.

---

**Test Case 4: Missing API Key for Selected Provider (Negative Test - Backend Behavior)**

1.  **Setup**:
    *   In `backend/.env`, set `LLM_PROVIDER="deepseek"`.
    *   Ensure `DEEPSEEK_API_KEY` is **not** set or is empty (e.g., `DEEPSEEK_API_KEY=""`).
    *   Ensure `GEMINI_API_KEY` is set (for web search).

2.  **Execution**:
    *   Restart the backend application.
    *   Open the frontend application and attempt a search query.

3.  **Expected Results**:
    *   The backend should raise a `ValueError` when it attempts to initialize the DeepSeek LLM without an API key (as implemented in `backend/src/agent/graph.py`).
    *   This error should propagate to the frontend, likely resulting in a failed search operation. The frontend might show a generic error message, or specific error handling might display a more informative message if implemented. Check the browser's developer console network tab for a failed request to the backend.

**Test Case 5: Missing Gemini API Key (Negative Test - Backend Behavior & Web Search)**

1.  **Setup**:
    *   In `backend/.env`, set `LLM_PROVIDER="gemini"` (or `"deepseek"`).
    *   Ensure `GEMINI_API_KEY` is **not** set or is empty.
    *   If `LLM_PROVIDER="deepseek"`, ensure `DEEPSEEK_API_KEY` is set.

2.  **Execution**:
    *   Restart the backend application.
    *   Open the frontend application and attempt a search query.

3.  **Expected Results**:
    *   **If `LLM_PROVIDER="gemini"`**: The backend should raise a `ValueError` when attempting to initialize any Gemini LLM. This will likely cause the search to fail early.
    *   **If `LLM_PROVIDER="deepseek"`**: The query generation, reflection, and answer generation might proceed if DeepSeek is correctly configured. However, the web research step (which uses `genai_client` with `GEMINI_API_KEY` in `backend/src/agent/graph.py`) will likely fail.
    *   The application might show an error related to API key issues or web search failure. The backend startup might also fail immediately due to the `GEMINI_API_KEY` check at the module level in `graph.py` if the key is missing entirely. (The check `if os.getenv("GEMINI_API_KEY") is None: raise ValueError("GEMINI_API_KEY is not set")` in `graph.py` would trigger).

---

This plan provides a structured approach to verifying the implemented LLM provider integration.
