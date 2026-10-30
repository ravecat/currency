default:
    @just --list

setup:
    pnpm install --frozen-lockfile

up: setup
    pnpm run dev

build:
    pnpm run build

[positional-arguments]
test *args:
    pnpm run test "$@"

check:
    pnpm run check

format:
    pnpm run format
