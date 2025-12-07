
// Stub for AI service
// Future: Implement Ollama or OpenAI call here

export async function generateTags(content: string): Promise<string[]> {
    // Mock implementation for now
    // In real implementation: call LLM with content summary
    console.log("Generating tags for content length:", content.length);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return ["Read Later", "Interesting", "AI Generated"];
}
