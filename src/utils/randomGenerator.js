/**
 * Generador de números pseudoaleatorios basado en semilla
 * Esta implementación usa una variante del algoritmo de congruencia lineal
 */
class SeededRandom {
  constructor(seed) {
    // Convertir la semilla a un número si es una cadena
    if (typeof seed === 'string') {
      this.seed = this.hashString(seed);
    } else {
      this.seed = seed || Math.floor(Math.random() * 1000000);
    }
    
    this.m = 2147483647;    // Módulo (número primo grande)
    this.a = 16807;         // Multiplicador
    this.c = 0;             // Incremento (0 para una implementación pura)
  }

  // Función para convertir una cadena en un número hash
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a entero de 32 bits
    }
    return Math.abs(hash);
  }

  // Generar el siguiente número aleatorio [0, 1)
  next() {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed / this.m;
  }

  // Generar un entero aleatorio entre min y max (inclusive)
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Generar un número aleatorio entre min y max, excluyendo los números en el array exclude
  nextIntExcluding(min, max, exclude = []) {
    let number;
    do {
      number = this.nextInt(min, max);
    } while (exclude.includes(number));
    return number;
  }
}

export default SeededRandom; 