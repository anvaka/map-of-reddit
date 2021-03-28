import eventify from 'ngraph.events';

const bus = eventify({});

export default bus;

export function setProgress(msg) {
    bus.fire('progress', msg());
}