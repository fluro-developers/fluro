export default class Cat {
  constructor() {
    this._name = 'Cat';
    console.log('Meow')
  }
  get name() {
    return this._name;
  }
}
