# Map of reddit

This code renders a [map of reddit](http://anvaka.github.io/map-of-reddit/).

[![map of reddit](https://i.imgur.com/bG3BB51.png)](http://anvaka.github.io/map-of-reddit/)

## How is it made?

I processed `176,178,986` comments that redditors left in years 2020 .. 2021, and computed
Jaccard Similarity between subreddits. 

Then I treated relationships between subreddits as  a graph clustering problem. Once clusters
are computed, I treated them as a graph layout problem and created an SVG file. Once SVG file 
was created I treated it as a dual problem of WebGL rendering and streaming SVG parsing, and
created my own webgl renderer and streaming svg parser. 

Along the way I strived for simplicity. I wanted to let people edit the SVG file, correct it,
and contribute to the development of the map. And I'm happy to say that it is possible to edit 
the map via [anvaka/map-of-reddit-data](https://github.com/anvaka/map-of-reddit-data).

There is a lot of things that I'd love to improve. But I want to know that this effort is not
in vain. If you enjoy the work - please consider supporting it on [patreon](https://www.patreon.com/anvaka)
or [github](https://github.com/sponsors/anvaka). Or share your suggestions and comments with me
on [twitter](https://twitter.com/anvaka).


## Running code locally

First - you need to clone/fork this repository and then:

```
npm install
```

Now you are ready to serve the website locally:

```
npm start
```

To compile a production build:

```
npm run build
```

### Customize vue configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## License

The code in this repository is licensed under MIT license.