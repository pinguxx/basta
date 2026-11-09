# ========================================================
# 🦀 Multi-stage Dockerfile for Basta Online
# Optimized for Render.com, Fly.io, Railway & Cloud Run
# ========================================================

# 1. Builder Stage
FROM rust:1-slim-bookworm AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends pkg-config && rm -rf /var/lib/apt/lists/*

# Cache dependencies
COPY Cargo.toml ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src target/release/deps/basta* target/release/basta*

# Build actual application
COPY src ./src
RUN cargo build --release

# 2. Runtime Stage
FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Security hardening: run as dedicated non-root user
RUN useradd -m -u 1000 basta && chown -R basta:basta /app
USER basta

# Copy compiled binary and static assets
COPY --from=builder --chown=basta:basta /app/target/release/basta /app/basta
COPY --chown=basta:basta public /app/public

# Render dynamically passes PORT (defaults to 3000)
ENV PORT=3000
EXPOSE 3000

CMD ["/app/basta"]
