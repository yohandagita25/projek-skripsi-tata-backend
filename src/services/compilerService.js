const axios = require('axios');

const runCCode = async (code) => {
  try {
    const response = await axios.post(
      "https://api.onecompiler.com/v1/run",
      {
        language: "c",
        files: [
          {
            name: "main.c",
            content: code
          }
        ]
      },
      {
        headers: {
          "X-OneCompiler-Key": process.env.ONECOMPILER_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("FULL RESPONSE:", response.data);

    return {
      stdout: response.data.stdout || "",
      stderr: response.data.stderr || "",
      executionTime: response.data.executionTime || null
    };

  } catch (error) {
    console.log("ERROR FROM ONECOMPILER:", error.response?.data);
    throw new Error(error.response?.data?.message || "Compiler error");
  }
};

module.exports = { runCCode };