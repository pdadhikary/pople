FROM ubuntu:26.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssh-client openmpi-bin libopenmpi40 \
    libgfortran5 libgomp1 libhwloc15 ca-certificates \
    xz-utils curl python3.14 python3.14-venv \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

ARG ORCA_TAR=orca_6_1_1_linux_x86-64_shared_openmpi418_nodmrg

COPY orca_bin/${ORCA_TAR}.tar.xz /tmp/

RUN mkdir -p /opt/orca && tar -xf /tmp/${ORCA_TAR}.tar.xz -C /opt/orca --strip-components=1 \
    && rm /tmp/${ORCA_TAR}.tar.xz

RUN userdel -r ubuntu 2>/dev/null || true \
    && groupdel ubuntu 2>/dev/null || true \
    && groupadd --gid 1000 pople \
    && useradd --uid 1000 --gid pople --create-home --shell /bin/bash pople

ENV PATH="/opt/orca:/usr/lib/x86_64-linux-gnu/openmpi/bin:$PATH"
ENV LD_LIBRARY_PATH="/opt/orca:/usr/lib/x86_64-linux-gnu/openmpi/lib"
ENV UV_PYTHON_PREFERENCE=only-system
ENV UV_PYTHON=/usr/bin/python3.14

WORKDIR /workspace

COPY pyproject.toml .python-version uv.lock ./

COPY apps/worker/pyproject.toml apps/worker/pyproject.toml

COPY packages/database/pyproject.toml packages/database/pyproject.toml

COPY packages/logging/pyproject.toml packages/logging/pyproject.toml

COPY packages/orca/pyproject.toml packages/orca/pyproject.toml

COPY packages/database/ packages/database/

COPY packages/logging/ packages/logging/

COPY packages/orca/ packages/orca/

RUN uv sync --package worker --frozen --no-dev

COPY apps/worker/ apps/worker/

RUN chown -R pople:pople /workspace

USER pople

ENV OMPI_MCA_btl_vader_single_copy_mechanism=none
ENV OMPI_ALLOW_RUN_AS_ROOT_CONFIRM=1

CMD ["uv", "run", "--directory", "apps/worker", "main.py"]
