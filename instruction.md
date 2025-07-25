🔄 Project Awareness & Context
Always read IMPLEMENTATION_guide.txt,C:\Users\DELL\Saas\Biz\changesMade.md and queriesRan.md at the start of a new conversation to understand the project's architecture, goals, style,existing functionalities and constraints.
Check Task.md before starting a new task. If the task isn’t listed, add it with a brief description and today's date.
Use consistent naming conventions, file structure, and architecture patterns as described in IMPLEMENTATION_guide.md
🧱 Code Structure & Modularity
Never create a file longer than 500 lines of code. If a file approaches this limit, refactor by splitting it into modules or helper files.
Organize code into clearly separated modules, grouped by feature or responsibility. For agents this looks like:
agent.py - Main agent definition and execution logic
tools.py - Tool functions used by the agent
prompts.py - System prompts
Use clear, consistent imports (prefer relative imports within packages).
Use python_dotenv and load_env() for environment variables.
🧪 Testing & Reliability
Always create Pytest unit tests for new features (functions, classes, routes, etc).
After updating any logic, check whether existing unit tests need to be updated. If so, do it.
Tests should live in a /tests folder mirroring the main app structure.
Include at least:
1 test for expected use
1 edge case
1 failure case
✅ Task Completion
Mark completed tasks in TASK.md immediately after finishing them.
Add new sub-tasks or TODOs discovered during development to TASK.md under a “Discovered During Work” section.
📎 Style & Conventions
Use Python as the primary language.
Follow PEP8, use type hints, and format with black.
Use pydantic for data validation.
Use Flask for APIs and Supabase or PostGre for ORM if applicable.
Write docstrings for every function using the Google style:
def example():
    """
    Brief summary.

    Args:
        param1 (type): Description.

    Returns:
        type: Description.
    """
📚 Documentation & Explainability
Update README.md when new features are added, dependencies change, or setup steps are modified.
Comment non-obvious code and ensure everything is understandable to a no code developer, mid-level developer.
When writing complex logic, add an inline # Reason: comment explaining the why, not just the what.
🧠 AI Behavior Rules
Never assume missing context. Ask questions if uncertain.
Never hallucinate libraries or functions – only use known, verified Python packages.
Always confirm file paths and module names exist before referencing them in code or tests.
Never delete or overwrite existing code unless explicitly instructed to or if part of a task from Task.md

Always update the changesMade.md file once you make any change or update

**Disclaimer this project is already deployed on vercel frontend at 'sabiops.vercel.app' and backend at 'sabiops-backend.vercel.app'

Ensure you follow all the rules , source directory 'C:\Users\DELL\Saas\Biz\*' frontend source code 'C:\Users\DELL\Saas\Biz\frontend\sabiops-frontend' backend source code 'C:\Users\DELL\Saas\Biz\backend\sabiops-backend' .

Anytime i make a request to you as a user always , i mean always reference this file and at the start of the conversation ensure you analyze the project, to understand project state