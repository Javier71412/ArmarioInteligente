// Fixture: a config that throws while loading. Jest must exit with an error, never green.
throw new Error('broken jest config fixture');
