// Trampa a propósito para comprobar la CI (#9). Este PR se cierra sin fusionar.
const api_key = 'Xk29vQpL7mZr4TbN8wYc1HdF6sJe3GuA';

it.only('ci trap', () => {
  expect(api_key).toHaveLength(32);
});
