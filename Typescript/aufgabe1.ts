interface Car {
  brand: string;
  model: string;
  price: number;
  year: number;
}

const sampleCars: Car[] = [
  { brand: "BMW", model: "M3", price: 85000, year: 2022 },
  { brand: "Audi", model: "A4", price: 42000, year: 2020 },
  { brand: "Porsche", model: "911 GT3", price: 180000, year: 2023 },
  { brand: "Volkswagen", model: "Golf", price: 28000, year: 2019 },
  { brand: "Mercedes-Benz", model: "AMG GT", price: 140000, year: 2021 }
];

function getTotalPrice(cars: Car[]): number {
  let total = 0;
  cars.forEach((car) => {
    total += car.price;
  });
  return total;
}

function printCars(cars: Car[]): void {
  cars.forEach((car) => {
    console.log(`${car.year} ${car.brand} ${car.model} - ${car.price.toLocaleString("de-DE")} €`);
  });
}

function getExpensiveCars(cars: Car[], minPrice: number): Car[] {
  const result: Car[] = [];
  cars.forEach((car) => {
    if (car.price > minPrice) {
      result.push(car);
    }
  });
  return result;
}

function getTotalPriceArray(cars: Car[]): number {
  return cars.reduce((sum, car) => sum + car.price, 0);
}

function printCarsArray(cars: Car[]): void {
  console.log(
    cars
      .map((car) => `${car.year} ${car.brand} ${car.model} - ${car.price.toLocaleString("de-DE")} €`)
      .join("\n")
  );
}

function getExpensiveCarsArray(cars: Car[], minPrice: number): Car[] {
  return cars.filter((car) => car.price > minPrice);
}

console.log("--- Alle Autos (forEach) ---");
printCars(sampleCars);

console.log("\n--- Gesamtpreis (forEach) ---");
console.log(`Gesamtwert: ${getTotalPrice(sampleCars).toLocaleString("de-DE")} €`);

console.log("\n--- Autos teurer als 50.000 € (filter) ---");
const expensive = getExpensiveCarsArray(sampleCars, 50000);
printCarsArray(expensive);

console.log("\n--- Gesamtpreis teurer Autos (reduce) ---");
console.log(`Gesamtwert teure Autos: ${getTotalPriceArray(expensive).toLocaleString("de-DE")} €`);