import sys
import os

# Add backend directory to sys.path so "app..." modules resolve correctly on Vercel
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
