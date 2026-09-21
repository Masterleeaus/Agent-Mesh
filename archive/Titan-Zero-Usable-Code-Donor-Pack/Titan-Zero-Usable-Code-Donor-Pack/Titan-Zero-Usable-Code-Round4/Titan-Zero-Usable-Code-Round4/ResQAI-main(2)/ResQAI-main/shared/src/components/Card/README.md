# Card

Container component with 4 variants, 4 padding levels, header/footer slots, clickable and hoverable modes.

## Variants
- `default` — bordered card
- `elevated` — shadow elevated card
- `bordered` — thicker border emphasis
- `flat` — transparent, no border

## Usage
```tsx
<Card variant="elevated" hoverable>
  <h3>Account Overview</h3>
  <p>Content here</p>
</Card>
<Card variant="default" clickable onClick={handleClick}>
  <Card header={<h2>Title</h2>}>Content</Card>
  <Card footer={<Button>Action</Button>}>...</Card>
</Card>
```

## Testing
Test variant rendering, hover elevation change, click handler, header/footer rendering, keyboard enter/space for clickable cards.
