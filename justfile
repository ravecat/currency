default:
    @just --list

setup:
    pnpm install --frozen-lockfile

up: setup
    pnpm exec concurrently --kill-others "pnpm run typecheck:watch" "pnpm run dev:server" "pnpm run storybook:server"

[positional-arguments]
storybook *args:
    pnpm run storybook "$@"

build:
    pnpm run build

[positional-arguments]
test *args:
    pnpm run test "$@"

check:
    pnpm run check

format:
    pnpm run format
