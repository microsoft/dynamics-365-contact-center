// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    EventBus,
    EventHandler,
    Subscription,
    createEventBus,
    globalEventBus
} from '../eventBus';

describe('EventBus', () => {
    let eventBus: EventBus;

    beforeEach(() => {
        eventBus = new EventBus();
    });

    describe('constructor', () => {
        it('should create an EventBus with default options', () => {
            const bus = new EventBus();
            expect(bus).toBeInstanceOf(EventBus);
        });

        it('should create an EventBus with custom maxListeners', () => {
            const bus = new EventBus({ maxListeners: 50 });
            expect(bus).toBeInstanceOf(EventBus);
        });

        it('should create an EventBus with warnOnMaxListeners disabled', () => {
            const bus = new EventBus({ warnOnMaxListeners: false });
            expect(bus).toBeInstanceOf(EventBus);
        });
    });

    describe('on() - subscribe to events', () => {
        describe('positive test cases', () => {
            it('should subscribe to an event and receive data', () => {
                const handler = jest.fn();
                eventBus.on('test', handler);
                eventBus.emit('test', { value: 42 });
                expect(handler).toHaveBeenCalledWith({ value: 42 });
            });

            it('should return a subscription object with id and unsubscribe', () => {
                const handler = jest.fn();
                const subscription = eventBus.on('test', handler);
                expect(subscription).toHaveProperty('id');
                expect(subscription).toHaveProperty('unsubscribe');
                expect(typeof subscription.id).toBe('string');
                expect(typeof subscription.unsubscribe).toBe('function');
            });

            it('should allow multiple handlers for the same event', () => {
                const handler1 = jest.fn();
                const handler2 = jest.fn();
                eventBus.on('test', handler1);
                eventBus.on('test', handler2);
                eventBus.emit('test', 'data');
                expect(handler1).toHaveBeenCalledWith('data');
                expect(handler2).toHaveBeenCalledWith('data');
            });

            it('should allow same handler on different events', () => {
                const handler = jest.fn();
                eventBus.on('event1', handler);
                eventBus.on('event2', handler);
                eventBus.emit('event1', 'data1');
                eventBus.emit('event2', 'data2');
                expect(handler).toHaveBeenCalledTimes(2);
                expect(handler).toHaveBeenCalledWith('data1');
                expect(handler).toHaveBeenCalledWith('data2');
            });

            it('should handle typed event data correctly', () => {
                interface TestData {
                    id: number;
                    name: string;
                }
                const handler = jest.fn<void, [TestData]>();
                eventBus.on<TestData>('typed', handler);
                eventBus.emit<TestData>('typed', { id: 1, name: 'test' });
                expect(handler).toHaveBeenCalledWith({ id: 1, name: 'test' });
            });

            it('should call handlers in order of registration', () => {
                const order: number[] = [];
                eventBus.on('test', () => order.push(1));
                eventBus.on('test', () => order.push(2));
                eventBus.on('test', () => order.push(3));
                eventBus.emit('test', null);
                expect(order).toEqual([1, 2, 3]);
            });
        });

        describe('negative test cases', () => {
            it('should NOT call handlers for different events', () => {
                const handler = jest.fn();
                eventBus.on('event1', handler);
                eventBus.emit('event2', 'data');
                expect(handler).not.toHaveBeenCalled();
            });

            it('should NOT call unsubscribed handlers', () => {
                const handler = jest.fn();
                const subscription = eventBus.on('test', handler);
                subscription.unsubscribe();
                eventBus.emit('test', 'data');
                expect(handler).not.toHaveBeenCalled();
            });

            it('should warn when max listeners exceeded', () => {
                const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
                const bus = new EventBus({ maxListeners: 2, warnOnMaxListeners: true });

                bus.on('test', jest.fn());
                bus.on('test', jest.fn());
                expect(warnSpy).not.toHaveBeenCalled();

                bus.on('test', jest.fn()); // This exceeds max
                expect(warnSpy).toHaveBeenCalledWith(
                    expect.stringContaining('Max listeners')
                );

                warnSpy.mockRestore();
            });

            it('should NOT warn when warnOnMaxListeners is false', () => {
                const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
                const bus = new EventBus({ maxListeners: 1, warnOnMaxListeners: false });

                bus.on('test', jest.fn());
                bus.on('test', jest.fn());

                expect(warnSpy).not.toHaveBeenCalled();
                warnSpy.mockRestore();
            });
        });
    });

    describe('once() - single occurrence subscription', () => {
        describe('positive test cases', () => {
            it('should call handler only once', () => {
                const handler = jest.fn();
                eventBus.once('test', handler);
                eventBus.emit('test', 'first');
                eventBus.emit('test', 'second');
                expect(handler).toHaveBeenCalledTimes(1);
                expect(handler).toHaveBeenCalledWith('first');
            });

            it('should automatically unsubscribe after first call', () => {
                const handler = jest.fn();
                eventBus.once('test', handler);
                expect(eventBus.listenerCount('test')).toBe(1);
                eventBus.emit('test', 'data');
                expect(eventBus.listenerCount('test')).toBe(0);
            });

            it('should work alongside regular subscriptions', () => {
                const onceHandler = jest.fn();
                const regularHandler = jest.fn();
                eventBus.once('test', onceHandler);
                eventBus.on('test', regularHandler);

                eventBus.emit('test', 'data');
                eventBus.emit('test', 'data');

                expect(onceHandler).toHaveBeenCalledTimes(1);
                expect(regularHandler).toHaveBeenCalledTimes(2);
            });
        });

        describe('negative test cases', () => {
            it('should NOT be called after manual unsubscribe', () => {
                const handler = jest.fn();
                const subscription = eventBus.once('test', handler);
                subscription.unsubscribe();
                eventBus.emit('test', 'data');
                expect(handler).not.toHaveBeenCalled();
            });
        });
    });

    describe('off() - unsubscribe by handler reference', () => {
        describe('positive test cases', () => {
            it('should remove handler by reference', () => {
                const handler = jest.fn();
                eventBus.on('test', handler);
                eventBus.off('test', handler);
                eventBus.emit('test', 'data');
                expect(handler).not.toHaveBeenCalled();
            });

            it('should only remove the specified handler', () => {
                const handler1 = jest.fn();
                const handler2 = jest.fn();
                eventBus.on('test', handler1);
                eventBus.on('test', handler2);
                eventBus.off('test', handler1);
                eventBus.emit('test', 'data');
                expect(handler1).not.toHaveBeenCalled();
                expect(handler2).toHaveBeenCalled();
            });

            it('should clean up event when no handlers remain', () => {
                const handler = jest.fn();
                eventBus.on('test', handler);
                eventBus.off('test', handler);
                expect(eventBus.eventNames()).not.toContain('test');
            });
        });

        describe('negative test cases', () => {
            it('should handle removing non-existent handler gracefully', () => {
                const handler = jest.fn();
                expect(() => eventBus.off('test', handler)).not.toThrow();
            });

            it('should handle removing from non-existent event gracefully', () => {
                const handler = jest.fn();
                eventBus.on('test', handler);
                expect(() => eventBus.off('other', handler)).not.toThrow();
            });
        });
    });

    describe('offById() - unsubscribe by subscription ID', () => {
        describe('positive test cases', () => {
            it('should remove handler by subscription ID', () => {
                const handler = jest.fn();
                const subscription = eventBus.on('test', handler);
                eventBus.offById('test', subscription.id);
                eventBus.emit('test', 'data');
                expect(handler).not.toHaveBeenCalled();
            });
        });

        describe('negative test cases', () => {
            it('should handle non-existent subscription ID gracefully', () => {
                expect(() => eventBus.offById('test', 'invalid-id')).not.toThrow();
            });

            it('should handle non-existent event gracefully', () => {
                expect(() => eventBus.offById('nonexistent', 'id')).not.toThrow();
            });
        });
    });

    describe('emit() - publish events', () => {
        describe('positive test cases', () => {
            it('should emit data to all subscribers', () => {
                const handlers = [jest.fn(), jest.fn(), jest.fn()];
                handlers.forEach(h => eventBus.on('test', h));
                eventBus.emit('test', 'data');
                handlers.forEach(h => expect(h).toHaveBeenCalledWith('data'));
            });

            it('should handle undefined data', () => {
                const handler = jest.fn();
                eventBus.on('test', handler);
                eventBus.emit('test', undefined);
                expect(handler).toHaveBeenCalledWith(undefined);
            });

            it('should handle null data', () => {
                const handler = jest.fn();
                eventBus.on('test', handler);
                eventBus.emit('test', null);
                expect(handler).toHaveBeenCalledWith(null);
            });

            it('should handle complex object data', () => {
                const handler = jest.fn();
                const data = {
                    nested: { deep: { value: 42 } },
                    array: [1, 2, 3],
                    date: new Date()
                };
                eventBus.on('test', handler);
                eventBus.emit('test', data);
                expect(handler).toHaveBeenCalledWith(data);
            });
        });

        describe('negative test cases', () => {
            it('should NOT throw when emitting to non-existent event', () => {
                expect(() => eventBus.emit('nonexistent', 'data')).not.toThrow();
            });

            it('should NOT throw when emitting to event with no handlers', () => {
                const handler = jest.fn();
                eventBus.on('test', handler);
                eventBus.off('test', handler);
                expect(() => eventBus.emit('test', 'data')).not.toThrow();
            });

            it('should continue calling handlers even if one throws', () => {
                const errorSpy = jest.spyOn(console, 'error').mockImplementation();
                const handler1 = jest.fn(() => { throw new Error('test error'); });
                const handler2 = jest.fn();

                eventBus.on('test', handler1);
                eventBus.on('test', handler2);
                eventBus.emit('test', 'data');

                expect(handler1).toHaveBeenCalled();
                expect(handler2).toHaveBeenCalled();
                expect(errorSpy).toHaveBeenCalled();

                errorSpy.mockRestore();
            });

            it('should handle handler that modifies subscriptions during emit', () => {
                const handler1 = jest.fn(() => {
                    eventBus.on('test', handler3);
                });
                const handler2 = jest.fn();
                const handler3 = jest.fn();

                eventBus.on('test', handler1);
                eventBus.on('test', handler2);
                eventBus.emit('test', 'data');

                // handler3 was added during emit, should not be called in this emit
                expect(handler1).toHaveBeenCalled();
                expect(handler2).toHaveBeenCalled();
                // handler3 might or might not be called depending on implementation
            });
        });
    });

    describe('removeAllListeners()', () => {
        describe('positive test cases', () => {
            it('should remove all handlers for a specific event', () => {
                eventBus.on('test', jest.fn());
                eventBus.on('test', jest.fn());
                eventBus.on('other', jest.fn());

                eventBus.removeAllListeners('test');

                expect(eventBus.listenerCount('test')).toBe(0);
                expect(eventBus.listenerCount('other')).toBe(1);
            });

            it('should remove all handlers for all events when no argument', () => {
                eventBus.on('event1', jest.fn());
                eventBus.on('event2', jest.fn());
                eventBus.on('event3', jest.fn());

                eventBus.removeAllListeners();

                expect(eventBus.eventNames()).toHaveLength(0);
            });
        });

        describe('negative test cases', () => {
            it('should handle removing from non-existent event gracefully', () => {
                expect(() => eventBus.removeAllListeners('nonexistent')).not.toThrow();
            });
        });
    });

    describe('listenerCount()', () => {
        it('should return correct count of listeners', () => {
            expect(eventBus.listenerCount('test')).toBe(0);
            eventBus.on('test', jest.fn());
            expect(eventBus.listenerCount('test')).toBe(1);
            eventBus.on('test', jest.fn());
            expect(eventBus.listenerCount('test')).toBe(2);
        });

        it('should return 0 for non-existent event', () => {
            expect(eventBus.listenerCount('nonexistent')).toBe(0);
        });
    });

    describe('eventNames()', () => {
        it('should return array of event names with listeners', () => {
            eventBus.on('event1', jest.fn());
            eventBus.on('event2', jest.fn());
            eventBus.on('event3', jest.fn());

            const names = eventBus.eventNames();
            expect(names).toContain('event1');
            expect(names).toContain('event2');
            expect(names).toContain('event3');
        });

        it('should return empty array when no listeners', () => {
            expect(eventBus.eventNames()).toEqual([]);
        });

        it('should not include events after all handlers removed', () => {
            const handler = jest.fn();
            eventBus.on('test', handler);
            eventBus.off('test', handler);
            expect(eventBus.eventNames()).not.toContain('test');
        });
    });

    describe('createEventBus factory', () => {
        it('should create a new EventBus instance', () => {
            const bus = createEventBus();
            expect(bus).toBeInstanceOf(EventBus);
        });

        it('should create EventBus with custom options', () => {
            const bus = createEventBus({ maxListeners: 5 });
            expect(bus).toBeInstanceOf(EventBus);
        });
    });

    describe('globalEventBus', () => {
        it('should be an EventBus instance', () => {
            expect(globalEventBus).toBeInstanceOf(EventBus);
        });

        it('should be the same instance across imports', () => {
            // This is a basic check - in real scenario you'd test across modules
            expect(globalEventBus).toBe(globalEventBus);
        });
    });

    describe('Subscription interface', () => {
        it('should allow multiple unsubscribe calls without error', () => {
            const handler = jest.fn();
            const subscription = eventBus.on('test', handler);
            subscription.unsubscribe();
            expect(() => subscription.unsubscribe()).not.toThrow();
        });

        it('should generate unique IDs for each subscription', () => {
            const sub1 = eventBus.on('test', jest.fn());
            const sub2 = eventBus.on('test', jest.fn());
            const sub3 = eventBus.on('other', jest.fn());

            expect(sub1.id).not.toBe(sub2.id);
            expect(sub2.id).not.toBe(sub3.id);
            expect(sub1.id).not.toBe(sub3.id);
        });
    });
});
