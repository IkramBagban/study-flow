export async function apiErrorMessage(
    response: Response,
    fallback = "Something went wrong. Please try again."
) {
    let serverMessage = "";
    try {
        const body = await response.json();
        serverMessage = typeof body?.error === "string" ? body.error : "";
    } catch {
        // The response may not be JSON.
    }

    if (response.status === 401) {
        return "Please sign in again to continue.";
    }

    if (response.status === 404) {
        return serverMessage || "This course item was not found or you do not have access to it.";
    }

    if (response.status === 403) {
        return "You do not have permission to perform this action.";
    }

    return serverMessage || fallback;
}
