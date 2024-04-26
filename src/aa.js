const { HfInference } = require('@huggingface/inference');

const hf = new HfInference("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");

hf.textGeneration({
    model: 'meta-llama/Meta-Llama-3-8B-Instruct',
    inputs: "hello hello hello",
    parameters: {
      max_new_tokens: 50,
    }
  }).then((possible_response) => {
    // handle successful response
    console.log(possible_response);
  }).catch((error) => {
    // handle error
    console.error(error);
  });
  