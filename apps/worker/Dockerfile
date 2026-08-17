FROM debian:bookworm-slim AS builder
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential wget xz-utils ca-certificates libhwloc-dev \
    && rm -rf /var/lib/apt/lists/*

ARG OMPI_MINOR_VER=4.1
ARG OMPI_VER=4.1.8
ARG ORCA_TAR=orca_6_1_1_linux_x86-64_shared_openmpi418_nodmrg


RUN wget -q https://download.open-mpi.org/release/open-mpi/v${OMPI_MINOR_VER}/openmpi-${OMPI_VER}.tar.gz \
    && tar -xf openmpi-${OMPI_VER}.tar.gz \
    && cd openmpi-${OMPI_VER} \
    && ./configure --prefix=/opt/openmpi \
    && make -j$(nproc) install

COPY orca_bin/${ORCA_TAR}.tar.xz /tmp/
RUN mkdir -p /opt/orca && tar -xf /tmp/${ORCA_TAR}.tar.xz -C /opt/orca --strip-components=1


FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssh-client libgfortran5 libgomp1 libhwloc15 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1000 pople \
    && useradd --uid 1000 --gid pople --create-home --shell /bin/bash pople

COPY --from=builder /opt/openmpi /opt/openmpi
COPY --from=builder /opt/orca /opt/orca

ENV PATH="/opt/orca:/opt/openmpi/bin:$PATH"
ENV LD_LIBRARY_PATH="/opt/orca:/opt/openmpi/lib"

WORKDIR /workspace

COPY pyproject.toml .python-version uv.lock ./

# Workspace dependencies
COPY apps/worker/pyproject.toml apps/worker/pyproject.toml
COPY packages/database/pyproject.toml packages/database/pyproject.toml
COPY packages/logging/pyproject.toml packages/logging/pyproject.toml
COPY packages/orca/pyproject.toml packages/orca/pyproject.toml

# Copy source for workspace dependencies
COPY packages/database/ packages/database/
COPY packages/logging/ packages/logging/
COPY packages/orca/ packages/orca/

RUN uv sync --package worker --frozen --no-dev

# Copy worker source
COPY apps/worker/ apps/worker/

RUN chown -R pople:pople /workspace /opt/openmpi

USER pople

CMD ["uv", "run", "--directory", "apps/worker", "main.py"]
