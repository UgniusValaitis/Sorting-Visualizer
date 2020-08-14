

document.addEventListener('DOMContentLoaded', function () {
    let data = {
        _sleep(millisecond) {
            return new Promise(resolve => setTimeout(resolve, millisecond));
        },

        _container: null,
        getContainer() {
            return this._container;
        },

        _children: null,
        getChildren() {
            return this._children;
        },

        _freeze: false,
        freeze() {
            this._freeze = true;
        },
        unfreeze() {
            this._freeze = false;
        },
        isFrozen() {
            return this._freeze;
        },

        _speed: 50,
        getSpeed() {
            return this._speed;
        },
        setSpeed(millisecond) {
            this._speed = millisecond;
        },

        get length() {
            return this._children.length;
        },
        set length(value) {
            throw 'Cannot set length';
        },

        async swap(i, j) {
            let container = this._container,
                children = this._children;

            if (i > j) [i, j] = [j, i];
            let elementI = children[i];
            let elementJ = children[j];
            let afterElementOfJ = children[j].nextElementSibling;


            container.insertBefore(elementJ, elementI);
            container.insertBefore(elementI, afterElementOfJ);


            [elementI.style.left, elementJ.style.left] = [elementJ.style.left, elementI.style.left];

            await this._sleep(this._speed);
        },

        async insert(i, target) {
            if (i === target) return;

            let container = this._container,
                children = this._children;
            let elementI = children[i];
            let elementTarget = children[target];
            let elementTargetPrev = elementTarget.previousElementSibling;

            container.insertBefore(children[i], children[target]);


            let liWidth = parseFloat(children[0].style.width);

            let targetPosition;
            if (target < i) {
                targetPosition = elementTarget.style.left;
                for (let j = target + 1; j <= i; j++) {
                    let left = parseFloat(children[j].style.left);
                    children[j].style.left = left + liWidth + 'px';
                }
            } else {
                targetPosition = elementTargetPrev.style.left;
                for (let j = i; j < target - 1; j++) {
                    let left = parseFloat(children[j].style.left);
                    children[j].style.left = left - liWidth + 'px';
                }
            }
            elementI.style.left = targetPosition;

            await this._sleep(this._speed);
        },

        _highlightNodes: [],
        removeHighlight() {
            while (this._highlightNodes.length) {
                let node = this._highlightNodes.shift();
                node.classList.remove('sorting');
            }
        },
        async highlight(...nodes) {
            this.removeHighlight();
            nodes.forEach(i => {
                if (i < 0 || i >= this.length) return;
                this._children[i].classList.add('sorting');
                this._highlightNodes.push(this._children[i]);
            });

            await this._sleep(this._speed);
        },

        render(amount) {
            let container = this._container;

            container.innerHTML = '';
            let containerHeight = parseInt(getComputedStyle(container, null).height);
            let Width = parseInt(getComputedStyle(container, null).width);
            let liWidth = Width / amount;
            let liBoardRadius = liWidth / 2;
            let colorStart = 'rgb(6,49,73);'.match(/\d+/g).map(Number);
            let colorEnd = 'rgb(113,243,193)'.match(/\d+/g).map(Number);
            let rDifference = (colorEnd[0] - colorStart[0]) / amount;
            let gDifference = (colorEnd[1] - colorStart[1]) / amount;
            let bDifference = (colorEnd[2] - colorStart[2]) / amount;

            let lis = [];
            for (let i = 0; i < amount; i++) {
                let li = document.createElement('li');
                let number = Math.round((containerHeight - liBoardRadius) / amount * i + liBoardRadius);
                li.number = number;
                li.style.height = number + 'px';
                li.style.width = liWidth + 'px';
                li.style.backgroundColor = `rgb(
                    ${Math.floor(colorStart[0] + rDifference * i)},
                    ${Math.floor(colorStart[1] + gDifference * i)},
                    ${Math.floor(colorStart[2] + bDifference * i)}
                )`;
                lis.push(li);
            }

            lis.sort(_ => 0.5 - Math.random());
            lis.forEach((li, i) => {
                li.style.left = liWidth * i + 'px';
                container.appendChild(li);
            });
        },

        _init: false,
        isInit() {
            return this._init;
        },
        init(container) {
            if (!container || container.nodeType !== 1) throw `'container' must be an element`;
            this._container = container;
            this._children = container.children;
            this._init = true;
        },

        *[Symbol.iterator]() {
            for (let element of this.children) {
                yield element;
            }
        }
    };
    data = new Proxy(data, {
        get(target, propKey, receiver) {
            if (typeof (propKey) !== "symbol" && /^\d+$/.test(propKey)) {
                if (target.isFrozen()) throw 'stop';
                return target._children[propKey].number;
            }
            return Reflect.get(target, propKey, receiver);
        }
    });
    let algorithm = {
        async bubble() {
            for (let i = data.length; i >= 0; i--) {
                let swapped = false;
                for (let j = 0; j < i - 1; j++) {
                    await data.highlight(j, j + 1);

                    if (data[j] > data[j + 1]) {
                        await data.swap(j, j + 1);
                        swapped = true;
                    }
                }
                if (!swapped) return;
            }
        },

        async selection() {
            let left = 0,
                right = data.length - 1;
            while (left < right) {
                let j = left;
                for (let i = left; i <= right; i++) {
                    if (data[j] > data[i]) {
                        j = i;
                    }

                    await data.highlight(left, i, j);
                }
                if (j) {
                    await data.swap(left, j);
                }
                left++;
            }
        },

        async quick(start = 0, end = data.length - 1) {
            let p = start;
            for (let i = start + 1; i <= end; i++) {
                await data.highlight(p, i);

                if (data[i] < data[p]) {
                    await data.insert(i, p);
                    p++;
                }
            }

            if (start < p - 1) {
                await this.quick(start, p - 1);
            }
            if (p < end - 1) {
                await this.quick(p + 1, end);
            }
        },

        async insert() {
            for (let i = 1; i < data.length; i++) {
                let j = i - 1,
                    k = i;
                await data.highlight(j, k);

                while (j >= 0 && data[k] < data[j]) {
                    await data.highlight(j, k);

                    await data.insert(k, j);
                    k = j;
                    j--;
                }
            }
        },

        async shell() {
            let gap = Math.floor(data.length / 2);
            while (gap > 0) {
                for (let i = 0; i < gap; i++) {
                    for (let j = i + gap; j < data.length; j += gap) {
                        let cur = j,
                            pre = j - gap;
                        await data.highlight(pre, cur);

                        while (pre >= 0 && data[pre] > data[cur]) {
                            await data.highlight(pre, cur);

                            await data.swap(cur, pre);
                            cur = pre;
                            pre -= gap;
                        }
                    }
                }
                gap = Math.floor(gap / 2);
            }
        },


        async comb() {
            let gap = Math.floor(data.length * 0.8);
            while (gap >= 1) {
                for (let i = 0; i < data.length - gap; i++) {
                    await data.highlight(i, i + gap);

                    if (data[i] > data[i + gap]) {
                        await data.swap(i, i + gap);
                    }
                }
                gap = Math.floor(gap * 0.8);
            }
        },

        async merge(left = 0, right = data.length - 1) {
            if (left === right) return;

            let middle = left + Math.floor((right - left) / 2);
            await this.merge(left, middle);
            await this.merge(middle + 1, right);

            middle++;
            while (left <= middle && middle <= right) {
                await data.highlight(left, middle);

                if (data[left] > data[middle]) {
                    await data.insert(middle, left);
                    middle++;
                }
                left++;
            }
        },

        async heap() {
            let maxHeap = async (i, length) => {
                let l = 2 * i + 1,
                    r = 2 * i + 2;
                if (l >= length) return;

                let max = (r < length && data[l] <= data[r]) ? r : l;
                await data.highlight(i, max);

                if (data[i] < data[max]) {
                    await data.swap(i, max);
                    await maxHeap(max, length);
                }
            }

            let length = data.length;
            // Create a max heap
            for (let i = Math.floor(length / 2) - 1; i >= 0; i--) {
                await maxHeap(i, length);
            }
            for (let i = length - 1; i >= 0; i--) {
                // Move the maximum number to the end
                await data.swap(0, i);
                // Heap sorting the remaining numbers
                await maxHeap(0, i);
            }
        },


    };

    let init = _ => {
        let containerNode = document.querySelector('#sort-view ul');
        let startNode = document.querySelector('#start');
        let stopNode = document.querySelector('#stop');
        let shuffleNode = document.querySelector('#shuffle');
        let algorithmNode = document.querySelector('#algorithm');
        let amountNode = document.querySelector('#amount');
        let speedNode = document.querySelector('#speed');
        let setSpeed = (speed) => {
            data.setSpeed(speed);
            let style = document.querySelector('style#transition-duration');
            if (!style) {
                style = document.createElement('style');
                style.id = 'transition-duration';
                document.head.appendChild(style);
            }
            style.innerText = `#sort-view li {transition-duration: ${speed / 1000}s};`;
        };

        data.init(containerNode);
        setSpeed(speedNode.value);
        data.render(parseInt(amountNode.value));

        startNode.addEventListener('click', event => {
            data.unfreeze();
            data.removeHighlight();

            startNode.disabled = true;
            startNode.classList.toggle('disable');
            let algo = algorithmNode.value;
            algorithm[algo]().then(function (v) {
                data.removeHighlight();
            }).catch(error => {
                console.log(error);
            }).finally(_ => {
                startNode.disabled = false;
                startNode.classList.toggle('disable');
            })


        });

        stopNode.addEventListener('click', event => {
            data.freeze();
        });

        algorithmNode.addEventListener('change', event => {
            data.freeze();
        });

        shuffleNode.addEventListener('click', event => {
            data.freeze();
            data.render(data.length);
        });

        speedNode.addEventListener('input', event => {
            setSpeed(parseInt(event.currentTarget.value));
        });

        amountNode.addEventListener('input', event => {
            let length = parseInt(event.currentTarget.value);
            data.render(length > 800 ? 800 : length);
        });

        (_ => {
            let sign = true,
                delay = 100;
            document.querySelector('#amount').addEventListener('keydown', event => {
                data.freeze();

                if (sign === false) return;
                if (event.key === 'ArrowUp') {
                    let length = parseInt(event.currentTarget.value) + 50;
                    if (length > 800) length = 800;
                    event.currentTarget.value = length;
                    data.render(length);

                    sign = false;
                    setTimeout(_ => sign = true, delay);
                } else if (event.key === 'ArrowDown') {
                    let length = parseInt(event.currentTarget.value) - 50;
                    if (length < 0) length = 0;
                    event.currentTarget.value = length;
                    data.render(length > 800 ? 800 : length);

                    sign = false;
                    setTimeout(_ => sign = true, delay);
                }
            });
        })();

        (_ => {
            let sign = true,
                delay = 10;
            document.querySelector('#speed').addEventListener('keydown', event => {
                if (sign === false) return;

                if (event.key === 'ArrowUp') {
                    let speed = parseInt(event.currentTarget.value) + 50;
                    event.currentTarget.value = speed;
                    setSpeed(speed);

                    sign = false;
                    setTimeout(_ => sign = true, delay);
                } else if (event.key === 'ArrowDown') {
                    let speed = parseInt(event.currentTarget.value) - 50;
                    if (speed < 0) speed = 0;
                    event.currentTarget.value = speed;
                    setSpeed(speed);

                    sign = false;
                    setTimeout(_ => sign = true, delay);
                }
            });
        })();
    }
    init();
});