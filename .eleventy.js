const filters = require('./utils/filters.js')
const transforms = require('./utils/transforms.js')
const collections = require('./utils/collections.js')
const Image = require('@11ty/eleventy-img')

const {
    DateTime
} = require("luxon");
const htmlmin = require("html-minifier");


const galleryData = require("./filters/gallerydata");

async function imageShortcode(src, alt, max, className = 'block max-w-full h-auto') {
    if(alt === undefined) {
        alt = '';
    }
  
    let metadata = await Image(src, {
        widths: [320, 500, 760, 1000, 1200],
        formats: ['webp', 'jpeg'],
        outputDir: './dist/img/'
    });
  
    let base = metadata.jpeg[metadata.jpeg.length - 1];
    if (max === 'md' && metadata.webp[2] !== undefined) {
        return `
        <picture>
            <source srcset="${metadata.webp[2].url}" type="image/webp" media="(min-width: 540px)">
            <source srcset="${metadata.webp[1].url}" type="image/webp" media="(min-width: 320px)">
            <source srcset="${metadata.webp[0].url}" type="image/webp">
            <source srcset="${metadata.jpeg[2].url}" type="image/jpeg" media="(min-width: 540px)">
            <source srcset="${metadata.jpeg[1].url}" type="image/jpeg" media="(min-width: 320px)">
            <source srcset="${metadata.jpeg[0].url}" type="image/jpeg">
            <img src="${metadata.jpeg[0].url}" alt="${alt}" loading="lazy" decoding="async" class="${className}">
        </picture>`
    } else if (max === 'lg'  && metadata.webp[2] !== undefined  && metadata.webp[3] !== undefined) {
        return `
        <picture>
            <source srcset="${metadata.webp[3].url}" type="image/webp" media="(min-width: 768px)">
            <source srcset="${metadata.webp[2].url}" type="image/webp" media="(min-width: 540px)">
            <source srcset="${metadata.webp[1].url}" type="image/webp" media="(min-width: 320px)">
            <source srcset="${metadata.webp[0].url}" type="image/webp">
            <source srcset="${metadata.jpeg[3].url}" type="image/jpeg" media="(min-width: 768px)">
            <source srcset="${metadata.jpeg[2].url}" type="image/jpeg" media="(min-width: 540px)">
            <source srcset="${metadata.jpeg[1].url}" type="image/jpeg" media="(min-width: 320px)">
            <source srcset="${metadata.jpeg[0].url}" type="image/jpeg">
            <img src="${metadata.jpeg[0].url}" alt="${alt}" loading="lazy" decoding="async" class="${className}">
        </picture>`
    } else {
        return `
        <picture>
            <source srcset="${metadata.webp[0].url}" type="image/webp">
            <source srcset="${metadata.jpeg[0].url}" type="image/jpeg">
            <img src="${metadata.jpeg[0].url}" alt="${alt}" loading="lazy" decoding="async" class="${className}">
        </picture>`
    };
}

module.exports = function (eleventyConfig) {
    // Folders to copy to build dir (See. 1.1)
    eleventyConfig.addPassthroughCopy("src/static");
    eleventyConfig.addPassthroughCopy("src/admin");
    eleventyConfig.addPassthroughCopy("src/images");
    // eleventyConfig.addPassthroughCopy("src/photoswipe");

    if (process.env.ELEVENTY_ENV === 'production') {
        // Minify HTML (including inlined CSS and JS) 
        eleventyConfig.addTransform("compressHTML", function (content, outputPath) {
            if (outputPath.endsWith(".html")) {
                let minified = htmlmin.minify(content, {
                    useShortDoctype: true,
                    removeComments: true,
                    collapseWhitespace: true,
                    minifyCSS: true,
                    minifyJS: true
                });
                return minified;
            }
            return content;
        });
    }

    // This allows Eleventy to watch for file changes during local development.
    eleventyConfig.addFilter('htmlDateString', (dateObj) => {
        return DateTime.fromJSDate(dateObj, {
            zone: 'utc'
        }).toFormat('yyyy-LL-dd');
    });

    eleventyConfig.addFilter("galleryData", galleryData);

    // Add YAML support for data files
    eleventyConfig.addDataExtension("yaml", contents => yaml.load(contents));

    eleventyConfig.setUseGitIgnore(false);

    eleventyConfig.addCollection("workSorted", function(collection) {
        return collection.getFilteredByTag("work").sort(function(a, b) {
            return b.data.order - a.data.order;
        });
    });

    eleventyConfig.addCollection("booksSorted", function(collection) {
        return collection.getFilteredByTag("book").sort(function(a, b) {
            return b.data.order - a.data.order;
        });
    });

    eleventyConfig.addCollection("textsSorted", function(collection) {
        return collection.getFilteredByTag("text").sort(function(a, b) {
            return b.data.order - a.data.order;
        });
    });    

    eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);

    return {
        dir: {
            input: "src/",
            output: "dist",
            includes: "_includes",
            layouts: "_layouts"
        },
        templateFormats: ["html", "md", "njk"],
        htmlTemplateEngine: "njk",

        // 1.1 Enable eleventy to pass dirs specified above
        passthroughFileCopy: true
    };
};