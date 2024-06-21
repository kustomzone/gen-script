script({ system: ["system"], temperature: 1, model: "openai:gpt-4-32k" })
// find previous tag
const pkg = JSON.parse((await workspace.readText("package.json")).content)
const { stdout: tag } = await host.exec("git", [
    "describe",
    "--tags",
    "--abbrev=0",
    "HEAD^",
])
const { stdout: commits } = await host.exec("git", ["log", `HEAD...${tag}`])
const { stdout: diff } = await host.exec("git", [
    "diff",
    `${tag}..HEAD`,
    "--no-merges",
    "--",
    ":!**/package.json",
    ":!**/genaiscript.d.ts",
    ":!.github/*",
    ":!.vscode/*",
    ":!yarn.lock",
])

def("COMMITS", commits, { maxTokens: 4000 })
def("DIFF", diff, { maxTokens: 20000 })

$`
You are an expert software developer and release manager.

## Task

Generate a clear, exciting, relevant, useful release notes
for the upcoming release ${pkg.version} of your software. The commits in the release are in COMMITS.
The diff of the changes are in DIFF.

## Guidelines

- tell a story about the changes
- use emojis
- do NOT give a commit overview
- add deep links to commits if possible. The repository is hosted at https://github.com/microsoft/genaiscript

`