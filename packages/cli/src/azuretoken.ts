import { AZURE_TOKEN_EXPIRATION } from "../../core/src/constants"
import { logVerbose } from "../../core/src/util"

/**
 * This module provides functions to handle Azure authentication tokens,
 * including checking expiration and creating new tokens using Azure Identity SDK.
 */

/**
 * Represents an authentication token with its expiration timestamp.
 */
export interface AuthenticationToken {
    token: string
    expiresOnTimestamp: number
}

/**
 * Checks if the Azure token is expired.
 *
 * @param token - The authentication token to check.
 * @returns True if the token is expired, false otherwise.
 *
 * This function avoids data races by considering the token expired slightly before
 * its actual expiration time.
 */
export function isAzureTokenExpired(token: AuthenticationToken) {
    // Consider the token expired 5 seconds before the actual expiration to avoid timing issues
    return !token || token.expiresOnTimestamp < Date.now() - 5_000
}

/**
 * Creates a new Azure authentication token.
 *
 * @param signal - An AbortSignal to allow aborting the token creation process.
 * @returns A promise that resolves to an AuthenticationToken.
 *
 * Utilizes DefaultAzureCredential from the Azure Identity SDK to obtain the token.
 * Logs the expiration time of the token for debugging or informational purposes.
 */
export async function createAzureToken(
    scopes: readonly string[],
    abortSignal: AbortSignal
): Promise<AuthenticationToken> {
    // Dynamically import DefaultAzureCredential from the Azure SDK
    const { DefaultAzureCredential } = await import("@azure/identity")

    // Obtain the Azure token using the DefaultAzureCredential
    const azureToken = await new DefaultAzureCredential().getToken(
        scopes.slice(),
        { abortSignal }
    )

    // Prepare the result token object with the token and expiration timestamp
    const res = {
        token: azureToken.token,
        // Use provided expiration timestamp or default to a constant expiration time
        expiresOnTimestamp: azureToken.expiresOnTimestamp
            ? azureToken.expiresOnTimestamp
            : Date.now() + AZURE_TOKEN_EXPIRATION,
    }

    // Log the expiration time of the token
    logVerbose(
        `azure token expires at ${new Date(res.expiresOnTimestamp).toLocaleString()}`
    )

    return res
}
