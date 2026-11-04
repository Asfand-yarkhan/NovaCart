// Seed catalogue for NovaCart. Prices are in PKR.
// `photo` is the Unsplash photo id the image in seed/images/<slug>.jpg was taken from.

const categories = [
    { name: 'Fruits', slug: 'fruits', blurb: 'Seasonal fruit from Swat, Sargodha and Multan orchards.' },
    { name: 'Vegetables', slug: 'vegetables', blurb: 'Picked at dawn, at your door the same day.' },
    { name: 'Dairy & Eggs', slug: 'dairy-eggs', blurb: 'Full-cream milk, farm eggs and proper cheese.' },
    { name: 'Meat & Seafood', slug: 'meat-seafood', blurb: 'Halal cuts and fish from the morning catch.' },
    { name: 'Bakery', slug: 'bakery', blurb: 'Baked overnight, delivered soft.' },
    { name: 'Pantry', slug: 'pantry', blurb: 'Rice, atta, spices and the jars you always run out of.' },
    { name: 'Beverages', slug: 'beverages', blurb: 'Tea, coffee, juice and water by the case.' },
    { name: 'Snacks', slug: 'snacks', blurb: 'Cookies, chocolate and nuts for the 4 pm slump.' }
];

const p = (category, name, slug, unit, price, stock, photo, extra = {}) => ({
    category, name, slug, unit, price, stock, photo, ...extra
});

const products = [
    // Fruits
    p('Fruits', 'Bananas', 'bananas', '1 dozen', 240, 120, 'photo-1571771894821-ce9b6c11b08e', {
        description: 'Sweet, ripe Sindhri bananas. Good for breakfast, shakes and banana bread. Delivered just yellow so they last the week.',
        featured: true, origin: 'Thatta, Sindh'
    }),
    p('Fruits', 'Kashmiri red apples', 'kashmiri-red-apples', '1 kg', 420, 80, 'photo-1560806887-1e4cd0b6cbd6', {
        description: 'Crisp, juicy red apples with a sweet-tart bite. Hand-sorted so there are no bruised ones in the bag.',
        compareAtPrice: 480, origin: 'Swat Valley'
    }),
    p('Fruits', 'Chaunsa mangoes', 'chaunsa-mangoes', '1 kg', 380, 60, 'photo-1553279768-865429fa0078', {
        description: 'The king of Pakistani mangoes. Fibre-free, honey-sweet flesh, ripened naturally without carbide.',
        featured: true, origin: 'Multan'
    }),
    p('Fruits', 'Sargodha kinnow', 'sargodha-kinnow', '1 dozen', 360, 90, 'photo-1587735243615-c03f25aaff15', {
        description: 'Easy-peel kinnow packed with juice. Peak season fruit straight from Sargodha orchards.',
        origin: 'Sargodha'
    }),
    p('Fruits', 'Strawberries', 'strawberries', '500 g punnet', 450, 40, 'photo-1464965911861-746a04b4bca6', {
        description: 'Bright, fragrant strawberries. Rinse just before eating and keep chilled.',
        compareAtPrice: 520, featured: true
    }),
    p('Fruits', 'Watermelon', 'watermelon', '1 pc, about 4 kg', 520, 25, 'photo-1587049352846-4a222e784d38', {
        description: 'Deep red, seedless-type watermelon. We tap-test every one before it leaves the warehouse.'
    }),
    p('Fruits', 'Black grapes', 'black-grapes', '1 kg', 650, 35, 'photo-1537640538966-79f369143f8f', {
        description: 'Plump, sweet black grapes with thin skins.', origin: 'Quetta'
    }),
    p('Fruits', 'Pineapple', 'pineapple', '1 pc', 690, 30, 'photo-1550258987-190a2d41a8ba', {
        description: 'Golden, ready-to-eat pineapple. Ask us to cut it and we will, free of charge.'
    }),
    p('Fruits', 'Kiwi', 'kiwi', '500 g', 780, 28, 'photo-1585059895524-72359e06133a', {
        description: 'Tangy green kiwi, high in vitamin C. Ripen at room temperature for a day if firm.'
    }),
    p('Fruits', 'Hass avocados', 'hass-avocados', '2 pcs', 1150, 18, 'photo-1523049673857-eb18f1d7b578', {
        description: 'Creamy imported Hass avocados. Ready to eat in one to two days.'
    }),
    p('Fruits', 'Lemons', 'lemons', '500 g', 180, 100, 'photo-1590502593747-42a996133562', {
        description: 'Juicy yellow lemons for nimbu pani, marinades and everything in between.'
    }),

    // Vegetables
    p('Vegetables', 'Carrots', 'carrots', '1 kg', 140, 150, 'photo-1598170845058-32b9d6a5da37', {
        description: 'Sweet, crunchy carrots. Perfect for gajar ka halwa or a quick salad.', featured: true
    }),
    p('Vegetables', 'Potatoes', 'potatoes', '2 kg', 220, 200, 'photo-1518977676601-b53f82aba655', {
        description: 'All-purpose potatoes that hold their shape in curries and crisp up in the oven.', origin: 'Okara'
    }),
    p('Vegetables', 'Red onions', 'red-onions', '2 kg', 300, 180, 'photo-1508747703725-719777637510', {
        description: 'Firm red onions with a sharp, sweet bite. The base of every good salan.'
    }),
    p('Vegetables', 'Vine tomatoes', 'vine-tomatoes', '1 kg', 260, 110, 'photo-1592924357228-91a4daadcfea', {
        description: 'Ripe, red tomatoes on the vine. Rich flavour for karahi and fresh salads.',
        compareAtPrice: 300, featured: true
    }),
    p('Vegetables', 'Spinach (palak)', 'spinach-palak', '1 bunch, about 500 g', 90, 70, 'photo-1576045057995-568f588f82fb', {
        description: 'Tender green spinach, washed once at the farm. Great for saag and palak paneer.'
    }),
    p('Vegetables', 'Cucumbers', 'cucumbers', '1 kg', 160, 90, 'photo-1449300079323-02e209d9d3a6', {
        description: 'Cool, crisp cucumbers for raita and kachumber.'
    }),
    p('Vegetables', 'Bell pepper mix', 'bell-pepper-mix', '500 g', 340, 45, 'photo-1563565375-f3fdfdbefa83', {
        description: 'Red, yellow and green capsicum. Sweet and colourful for stir-fries and pizza.'
    }),
    p('Vegetables', 'Garlic', 'garlic', '250 g', 210, 120, 'photo-1540148426945-6cf22a6b2383', {
        description: 'Plump local garlic bulbs with a strong, clean aroma.'
    }),
    p('Vegetables', 'Cabbage', 'cabbage', '1 pc', 150, 60, 'photo-1594282486552-05b4d80fbb9f', {
        description: 'Tight, heavy green cabbage. Lasts well in the fridge.'
    }),
    p('Vegetables', 'Broccoli', 'broccoli', '500 g', 390, 0, 'photo-1615485290382-441e4d049cb5', {
        description: 'Fresh green broccoli crowns. Steam, roast or toss into pasta.'
    }),

    // Dairy & Eggs
    p('Dairy & Eggs', 'Full-cream milk', 'full-cream-milk', '1 litre', 220, 140, 'photo-1550583724-b2692b85b150', {
        description: 'Pasteurised full-cream milk from grass-fed cows. Delivered chilled.', featured: true
    }),
    p('Dairy & Eggs', 'Salted butter', 'salted-butter', '200 g', 590, 60, 'photo-1589985270826-4b7bb135bc9d', {
        description: 'Rich, creamy salted butter for parathas and toast.'
    }),
    p('Dairy & Eggs', 'Aged cheddar', 'aged-cheddar', '200 g', 950, 30, 'photo-1486297678162-eb2a19b0a32d', {
        description: 'Sharp, crumbly cheddar aged for nine months.', compareAtPrice: 1100
    }),
    p('Dairy & Eggs', 'Desi eggs', 'desi-eggs', '12 pcs', 480, 85, 'photo-1582722872445-44dc5f7e3c8f', {
        description: 'Free-range desi eggs with deep orange yolks. Packed in a sturdy tray.', featured: true
    }),
    p('Dairy & Eggs', 'Strawberry yogurt', 'strawberry-yogurt', '4 cups', 520, 40, 'photo-1488477181946-6428a0291777', {
        description: 'Thick set yogurt layered with real strawberry. No artificial colour.'
    }),

    // Meat & Seafood
    p('Meat & Seafood', 'Boneless chicken breast', 'boneless-chicken-breast', '1 kg', 1250, 50, 'photo-1604503468506-a8da13d82791', {
        description: 'Halal, antibiotic-free chicken breast. Trimmed and vacuum-packed.', featured: true
    }),
    p('Meat & Seafood', 'Beef sirloin', 'beef-sirloin', '1 kg', 2100, 20, 'photo-1603048297172-c92544798d5a', {
        description: 'Tender halal beef sirloin, cut to order. Good for steaks and boti.'
    }),
    p('Meat & Seafood', 'BBQ mixed cuts', 'bbq-mixed-cuts', '1 kg', 2450, 15, 'photo-1607623814075-e51df1bdc82f', {
        description: 'A mix of beef and mutton cuts, ready for the grill. Marinade not included.'
    }),
    p('Meat & Seafood', 'Rainbow trout', 'rainbow-trout', '2 pcs, about 700 g', 1600, 12, 'photo-1510130387422-82bed34b37e9', {
        description: 'Cold-water trout from the north. Cleaned and gutted, head on.', origin: 'Naran'
    }),
    p('Meat & Seafood', 'Salmon fillet', 'salmon-fillet', '500 g', 3900, 8, 'photo-1499125562588-29fb8a56b5d5', {
        description: 'Skin-on Norwegian salmon fillet. Kept below 2 °C from port to door.'
    }),
    p('Meat & Seafood', 'Sea bream', 'sea-bream', '1 pc, about 500 g', 1350, 10, 'photo-1611171711912-e3f6b536f532', {
        description: 'Whole sea bream, scaled and cleaned. Roast it with lemon and garlic.'
    }),
    p('Meat & Seafood', 'Tiger prawns', 'tiger-prawns', '500 g', 2300, 14, 'photo-1565680018434-b513d5e5fd47', {
        description: 'Large shell-on prawns from Karachi harbour. Frozen at sea.', origin: 'Karachi'
    }),

    // Bakery
    p('Bakery', 'Multigrain loaf', 'multigrain-loaf', '650 g', 420, 40, 'photo-1509440159596-0249088772ff', {
        description: 'Dense, nutty loaf with oats, flax and sunflower seeds.'
    }),
    p('Bakery', 'Sourdough', 'sourdough', '800 g', 680, 25, 'photo-1549931319-a545dcf3bc73', {
        description: 'Slow-fermented sourdough with a crackling crust. Sliced on request.', featured: true
    }),
    p('Bakery', 'Butter croissants', 'butter-croissants', '4 pcs', 760, 30, 'photo-1555507036-ab1f4038808a', {
        description: 'Flaky, all-butter croissants baked before sunrise.'
    }),
    p('Bakery', 'Chocolate cupcakes', 'chocolate-cupcakes', '6 pcs', 900, 20, 'photo-1612203985729-70726954388c', {
        description: 'Moist chocolate cupcakes with whipped vanilla frosting.'
    }),

    // Pantry
    p('Pantry', 'Sella basmati rice', 'sella-basmati-rice', '5 kg', 2150, 70, 'photo-1586201375761-83865001e31c', {
        description: 'Extra-long grain sella basmati, aged for a year. Cooks fluffy and separate for biryani.',
        featured: true, compareAtPrice: 2400
    }),
    p('Pantry', 'Extra virgin olive oil', 'extra-virgin-olive-oil', '500 ml', 1890, 35, 'photo-1474979266404-7eaacbcd87c5', {
        description: 'Cold-pressed Spanish olive oil with a peppery finish.'
    }),
    p('Pantry', 'Kabuli chana', 'kabuli-chana', '1 kg', 420, 90, 'photo-1515543904379-3d757afe72e4', {
        description: 'Large white chickpeas for chana chaat and hummus. Soak overnight.'
    }),
    p('Pantry', 'Chakki atta', 'chakki-atta', '10 kg', 1450, 60, 'photo-1610725664285-7c57e6eeac3f', {
        description: 'Stone-ground whole wheat flour. Soft rotis that stay soft.'
    }),
    p('Pantry', 'Whole garam masala', 'whole-garam-masala', '100 g', 380, 75, 'photo-1596040033229-a9821ebd058d', {
        description: 'Cinnamon, cloves, cardamom, black pepper and bay leaf, ready to grind.'
    }),
    p('Pantry', 'Sidr honey', 'sidr-honey', '500 g', 2400, 22, 'photo-1558642452-9d2a7deb7f62', {
        description: 'Raw Sidr (beri) honey from Karak. Thick, dark and unfiltered.', origin: 'Karak, KP'
    }),

    // Beverages
    p('Beverages', 'Fresh orange juice', 'fresh-orange-juice', '1 litre', 480, 30, 'photo-1600271886742-f049cd451bba', {
        description: 'Cold-pressed orange juice, no added sugar. Best within three days.', featured: true
    }),
    p('Beverages', 'Lemon iced tea', 'lemon-iced-tea', '1 litre', 350, 45, 'photo-1556679343-c7306c1976bc', {
        description: 'Brewed black tea with lemon and a little cane sugar. Serve over ice.'
    }),
    p('Beverages', 'Mineral water', 'mineral-water', '6 × 1.5 L', 540, 120, 'photo-1548839140-29a749e1cf4d', {
        description: 'Natural mineral water, sealed six-pack.'
    }),
    p('Beverages', 'Loose black tea', 'loose-black-tea', '475 g', 1150, 80, 'photo-1564890369478-c89ca6d9cde9', {
        description: 'Strong Kenyan blend for doodh patti that actually tastes like tea.'
    }),
    p('Beverages', 'Green tea', 'green-tea', '25 bags', 450, 65, 'photo-1576092768241-dec231879fc3', {
        description: 'Light, grassy green tea with a hint of jasmine.'
    }),
    p('Beverages', 'Arabica coffee beans', 'arabica-coffee-beans', '250 g', 1950, 25, 'photo-1447933601403-0c6688de566e', {
        description: 'Medium-roast whole beans with notes of cocoa and caramel. Roasted in Lahore.'
    }),

    // Snacks
    p('Snacks', 'Chocolate chip cookies', 'chocolate-chip-cookies', '12 pcs', 650, 40, 'photo-1558961363-fa8fdf82db35', {
        description: 'Chewy cookies loaded with dark chocolate chunks.'
    }),
    p('Snacks', 'Assorted chocolates', 'assorted-chocolates', '250 g box', 1800, 15, 'photo-1599599810769-bcde5a160d32', {
        description: 'Hand-made truffles and pralines in a gift box.'
    }),
    p('Snacks', 'California almonds', 'california-almonds', '250 g', 1100, 50, 'photo-1508061253366-f7da158b6d46', {
        description: 'Raw, unsalted almonds. A handful a day keeps the snack drawer honest.'
    })
];

// Lifestyle images used by the storefront (frontend/public/images)
const lifestyle = {
    'hero-bags': 'photo-1588964895597-cfccd6e2dbf9',
    'market-stall': 'photo-1488459716781-31db52582fe9',
    'veg-shelves': 'photo-1607349913338-fca6f7fc42d0',
    'produce-dark': 'photo-1518843875459-f738682238a6',
    'store-aisle': 'photo-1542838132-92c53300491e',
    'cat-fruits': 'photo-1610832958506-aa56368176cf',
    'cat-vegetables': 'photo-1566385101042-1a0aa0c1268c',
    'cat-dairy-eggs': 'photo-1582722872445-44dc5f7e3c8f',
    'cat-meat-seafood': 'photo-1607623814075-e51df1bdc82f',
    'cat-bakery': 'photo-1509440159596-0249088772ff',
    'cat-pantry': 'photo-1596040033229-a9821ebd058d',
    'cat-beverages': 'photo-1600271886742-f049cd451bba',
    'cat-snacks': 'photo-1599599810769-bcde5a160d32'
};

module.exports = { categories, products, lifestyle };
