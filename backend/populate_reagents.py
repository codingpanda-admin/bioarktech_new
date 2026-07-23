import os
import sys
import django

# Setup django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def main():
    print("populate_reagents.py: Skipping population (as per products.json request).")

if __name__ == '__main__':
    main()
