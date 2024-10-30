import subprocess

def run_pipeline():
    # Run the s2s_pipeline.py with the provided config.json file
    subprocess.run(["python", "s2s_pipeline.py", "config.json"])

if __name__ == "__main__":
    run_pipeline()
