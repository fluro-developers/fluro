export default class Dog {
  constructor() {
    this._name = 'Dog';
    console.log('Woof')
  }
  get name() {
    return this._name;
  }
}
