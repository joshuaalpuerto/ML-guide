# Exploring crew-ai agents

## Setup

### Conda Environment

**Install Conda:**
If you don't have Conda installed, download and install it from [https://docs.conda.io/en/latest/miniconda.html](https://docs.conda.io/en/latest/miniconda.html).

**Create Conda Environment:**
Open a terminal and navigate to your project directory. Run the following command to create a Conda environment named `my_project_env` (you can change the name as needed):

```bash
conda create --name crew-ai python=3.10
conda activate  crew-ai
```

### Poetry Installation

**Install Poetry**

```bash
conda install poetry
```

**Install dependencies**

```bash
poetry install
```

> There is a known [issue](https://github.com/python-poetry/poetry/issues/7936) with poetry when adding new package. If you encounter issue about `'HTTPResponse' object has no attribute 'strict'` run the command below ([fix](https://github.com/python-poetry/poetry/issues/7936#issuecomment-1636969981) )

```bash
  pip install -U requests==2.28.2 urllib3==1.26.15
```
