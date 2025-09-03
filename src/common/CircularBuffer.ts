export class CircularBuffer<T> {
  private endOffset = 0;
  private startOffset = 0;
  private readonly arr: Array<T>;
  private needShift = false;

  constructor(private readonly capacity: number) {
    this.arr = new Array(capacity);
  }

  push(item: T) {
    if (this.needShift) this.shift();
    this.arr[this.endOffset++] = item;
    this.endOffset %= this.capacity;
    if (this.endOffset === this.startOffset) this.needShift = true;
  }

  shift() {
    if (!this.needShift && this.startOffset === this.endOffset) return undefined;
    this.needShift = false;
    const res = this.arr[this.startOffset++];
    this.startOffset %= this.capacity;
    return res;
  }

  find(param: (e: T, idx: number) => boolean): T | undefined {
    for(let i = this.startOffset; i < (this.needShift ? this.capacity : 0) + this.endOffset; i++) {
      const relIdx = (this.startOffset+i)%this.capacity;
      if (param(this.arr[relIdx], i)) return this.arr[relIdx];
    }
  }
}
