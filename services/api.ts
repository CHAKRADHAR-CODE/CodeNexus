
export async function saveUser(data: any) {
  try {
    const res = await fetch("http://localhost:5000/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error(`Error: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
