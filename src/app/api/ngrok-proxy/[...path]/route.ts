import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, API_KEY } from "@/constants";

// Helper to build the target URL
function buildTargetUrl(request: NextRequest, pathSegments: string[]): string {
  const path = pathSegments.join("/");
  const searchParams = request.nextUrl.searchParams;
  
  // Ensure api_key is always present
  if (!searchParams.has("api_key")) {
    searchParams.set("api_key", API_KEY);
  }
  
  const queryString = searchParams.toString();
  const targetUrl = `${API_BASE_URL}/${path}${queryString ? `?${queryString}` : ""}`;
  
  return targetUrl;
}

// Handle all HTTP methods
async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }): Promise<NextResponse> {
  try {
    const { path } = await params;
    const targetUrl = buildTargetUrl(request, path);
    
    // Prepare headers
    const headers = new Headers();
    
    // Copy relevant headers from the original request
    const headersToForward = [
      "accept",
      "accept-language",
      "content-type",
      "authorization",
      "x-requested-with",
    ];
    
    for (const header of headersToForward) {
      const value = request.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    }
    
    // Add ngrok skip warning header
    headers.set("ngrok-skip-browser-warning", "true");
    
    // Prepare body for non-GET/HEAD requests
    let body: BodyInit | undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      const contentType = request.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        body = await request.text();
      } else if (contentType?.includes("multipart/form-data") || contentType?.includes("application/x-www-form-urlencoded")) {
        body = await request.blob();
      }
    }
    
    // Make the request to the ngrok backend
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: "follow",
    });
    
    // Prepare response headers
    const responseHeaders = new Headers();
    
    // Copy relevant headers from the target response
    const headersToCopy = [
      "content-type",
      "content-length",
      "cache-control",
      "etag",
      "last-modified",
    ];
    
    for (const header of headersToCopy) {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    }
    
    // Get response body
    const responseBody = await response.arrayBuffer();
    
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error("[NgrokProxy] Proxy error:", error);
    
    return NextResponse.json(
      { 
        error: "Proxy request failed", 
        message: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 502 }
    );
  }
}

// Export handlers for all HTTP methods
export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const HEAD = handleProxy;
export const OPTIONS = handleProxy;
