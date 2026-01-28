from setuptools import setup, find_packages

setup(
    name="python-motion-planning",
    version="2.0.dev2",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "numpy",
        "scipy",
        "matplotlib",
        "osqp",
        "gymnasium",
        "faiss-cpu",
        "pyvista",
        "pyvistaqt"
    ],
    python_requires=">=3.6",
)
