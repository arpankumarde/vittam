"""
Uvicorn Runner for Vittam FastAPI Application

Run this file to start the Vittam API server.

Usage:
    python runner.py

Or with custom settings:
    python runner.py --host 0.0.0.0 --port 8080
"""

import os
import sys
import argparse
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def main():
    """Run the Vittam API server."""
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run Vittam API Server")
    parser.add_argument(
        "--host",
        type=str,
        default=os.getenv("HOST", "0.0.0.0"),
        help="Host to bind the server (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.getenv("PORT", 8000)),
        help="Port to bind the server (default: 8000)"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        default=os.getenv("RELOAD", "false").lower() == "true",
        help="Enable auto-reload for development"
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=int(os.getenv("WORKERS", 1)),
        help="Number of worker processes (default: 1)"
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default=os.getenv("LOG_LEVEL", "info"),
        choices=["critical", "error", "warning", "info", "debug", "trace"],
        help="Log level (default: info)"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("   TATA CAPITAL PERSONAL LOANS")
    print("   Powered by VITTAM - AI Loan Assistant API")
    print("=" * 60)
    print(f"\nStarting server...")
    print(f"   Host: {args.host}")
    print(f"   Port: {args.port}")
    print(f"   Workers: {args.workers}")
    print(f"   Reload: {args.reload}")
    print(f"   Log Level: {args.log_level}")
    print(f"\nAPI will be available at: http://{args.host}:{args.port}")
    print(f"API Docs: http://{args.host}:{args.port}/docs")
    print(f"ReDoc: http://{args.host}:{args.port}/redoc")
    print("=" * 60 + "\n")
    
    # Run uvicorn
    uvicorn.run(
        "app:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers if not args.reload else 1,  # Can't use workers with reload
        log_level=args.log_level,
    )


if __name__ == "__main__":
    main()

