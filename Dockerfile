FROM rust:1.77-slim as builder

WORKDIR /app
COPY engine/ ./engine/
WORKDIR /app/engine
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/engine/target/release/techub-arbitrades-engine /usr/local/bin/
EXPOSE 3001
CMD ["techub-arbitrades-engine"]
