/** Smoke test: Testing Library finds controls by role and accessible name (CONSTRAINTS.md §2 «Etiquetas»). */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

test('finds a button by role and name', async () => {
  const onPress = jest.fn();
  await render(
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Text>Confirmar outfit</Text>
    </Pressable>,
  );

  await fireEvent.press(screen.getByRole('button', { name: 'Confirmar outfit' }));

  expect(onPress).toHaveBeenCalledTimes(1);
});
