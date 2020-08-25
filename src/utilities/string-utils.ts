export function stripDuplicateSlashes(input: string): string {
    return input.replace(/\/+/g, "/") // replace consecutive slashes with a single slash
        .replace(/\/+$/, ""); // remove trailing slashes
}
