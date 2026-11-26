// Clean case: a described @ts-expect-error is allowed (CONSTRAINTS.md §0).
// @ts-expect-error -- the third-party type is wrong, see issue #0 in the fixture
export const value: number = 'not a number';
