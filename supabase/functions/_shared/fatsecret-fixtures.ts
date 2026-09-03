export const fatSecretChipotleSearchFixture = {
  foods_search: {
    results: {
      food: [
        {
          food_id: '1001',
          food_name: 'Chicken',
          food_type: 'Brand',
          brand_name: 'Chipotle',
          servings: {
            serving: [
              {
                serving_id: '2001',
                serving_description: '1 serving',
                metric_serving_amount: '113.000',
                metric_serving_unit: 'g',
                calories: '180',
                carbohydrate: '0',
                protein: '32',
                fat: '7',
                fiber: '0',
                sugar: '0',
                sodium: '310',
                is_default: '1',
              },
              {
                serving_id: '2002',
                serving_description: '100 g',
                metric_serving_amount: '100.000',
                metric_serving_unit: 'g',
                calories: '159',
                carbohydrate: '0',
                protein: '28.3',
                fat: '6.2',
                fiber: '0',
                sugar: '0',
                sodium: '274',
              },
            ],
          },
        },
      ],
    },
  },
};

export const fatSecretAutocompleteFixture = {
  suggestions: {
    suggestion: ['Chipotle Chicken', 'Chipotle Chicken Bowl'],
  },
};

export const fatSecretBigMacFoodFixture = {
  food: {
    food_id: '1002',
    food_name: 'Big Mac',
    food_type: 'Brand',
    brand_name: "McDonald's",
    servings: {
      serving: {
        serving_id: '3001',
        serving_description: '1 burger',
        metric_serving_amount: '219.000',
        metric_serving_unit: 'g',
        calories: '563',
        carbohydrate: '45',
        protein: '26',
        fat: '33',
        fiber: '3',
        sugar: '9',
        sodium: '1010',
        is_default: '1',
      },
    },
  },
};
