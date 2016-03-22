/* globals before, describe, it */

var assert = require('assert')
var marky = require('..')
var fixtures = require('./fixtures')

describe('markdown processing', function () {
  var $
  before(function () {
    $ = marky(fixtures.basic, {highlightSyntax: true})
  })

  it('preserves query parameters in URLs when making them into links', function () {
    assert(~fixtures.basic.indexOf('watch?v=dQw4w9WgXcQ'))
    assert.equal($("a[href*='youtube.com']").attr('href'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  describe('github flavored markdown', function () {
    it('renders relaxed link reference definitions the same as normal ones', function () {
      assert(~fixtures['link-ref'].indexOf('[linkref]:'))
      assert(~fixtures['link-ref-relaxed'].indexOf('[linkref]:'))
      var $normal = marky(fixtures['link-ref'])
      var $relaxed = marky(fixtures['link-ref-relaxed'])
      assert($normal('a[href="/actual/link/here"]').length)
      assert($relaxed('a[href="/actual/link/here"]').length)
      assert.equal($normal.html(), $relaxed.html())
    })

    it('converts leading tabs in code blocks to spaces', function () {
      var $ = marky(fixtures.basic)
      var indentHtml = $('.highlight.js .line .comment span:not(.js)').html()
      assert(!~indentHtml.indexOf('\t'))
      assert(~indentHtml.indexOf('&#xA0;'))
    })

    it('linkifies fully-qualified URLs', function () {
      assert(~fixtures['maintenance-modules'].indexOf('- https://gist.github.com/sindresorhus/8435329'))
      var $ = marky(fixtures['maintenance-modules'])
      assert($("a[href='https://gist.github.com/sindresorhus/8435329']").length)
    })

    it('does not convert text emoticons to unicode', function () {
      assert(~fixtures.github.indexOf(':)'))
      var $ = marky(fixtures.github)
      assert(~$.html().indexOf(':)'))
    })

    describe('task lists', function () {
      var $todo
      before(function () {
        $todo = marky(fixtures['task-list'])
      })

      it('adds input.task-list-item-checkbox in items', function () {
        assert(~$todo('input.task-list-item-checkbox').length)
      })

      it('renders items marked up as [ ] as unchecked', function () {
        var shouldBeUnchecked = (fixtures['task-list'].match(/[\.\*\+-]\s+\[ \]/g) || []).length
        assert.equal(shouldBeUnchecked, $todo('input[type=checkbox].task-list-item-checkbox:not(:checked)').length)
      })

      it('renders items marked up as [x] as checked', function () {
        var shouldBeChecked = (fixtures['task-list'].match(/[\.\*\+-]\s+\[x\]/g) || []).length
        assert.equal(shouldBeChecked, $todo('input[type=checkbox].task-list-item-checkbox:checked').length)
      })

      it('always disables the rendered checkboxes', function () {
        assert(!$todo('input[type=checkbox].task-list-item-checkbox:not([disabled])').length)
      })

      it('does NOT render [  ], [ x], [x ], or [ x ] as checkboxes', function () {
        var html = $todo.html()
        assert(~html.indexOf('[  ]'))
        assert(~html.indexOf('[x ]'))
        assert(~html.indexOf('[ x]'))
        assert(~html.indexOf('[ x ]'))
      })

      it('adds class .task-list-item to parent <li>', function () {
        assert(~$todo('li.task-list-item').length)
      })

      it('adds class .task-list to lists', function () {
        assert(~$todo('ol.task-list, ul.task-list').length)
      })

      it('only adds .task-list to most immediate parent list', function () {
        assert($todo('ol:not(.task-list) ul.task-list').length)
      })
    })
  })

  describe('syntax highlighting', function () {
    it('converts github flavored fencing to code blocks', function () {
      assert(~fixtures.basic.indexOf('```js'))
      assert($('.highlight.js').length)
    })

    it('adds js class to javascript blocks', function () {
      assert(~fixtures.basic.indexOf('```js'))
      assert($('.highlight.js').length)
    })

    it('adds sh class to shell blocks', function () {
      assert(~fixtures.basic.indexOf('```sh'))
      assert($('.highlight.sh').length)
    })

    it('adds coffeescript class to coffee blocks', function () {
      assert(~fixtures.basic.indexOf('```coffee'))
      assert($('.highlight.coffeescript').length)
    })

    it('adds diff class to diff blocks', function () {
      assert(~fixtures.basic.indexOf('```diff'))
      assert($('.highlight.diff').length)
    })

    it('wraps code highlighter output in div.highlight', function () {
      // the idea here is that we have a 1:1 correspondence of <div class='highlight'>
      // and their contained <pre class='editor'> elements coming from the highlighter
      assert.equal($('div.highlight').length, $('div.highlight > pre.editor').length)
    })

    it('applies inline syntax highlighting classes to javascript', function () {
      assert($('.js.modifier').length)
      assert($('.js.function').length)
    })

    it('applies inline syntax highlighting classes to shell', function () {
      assert($('.shell.builtin').length)
    })

    it('applies inline syntax highlighting classes to coffeescript', function () {
      assert($('.coffee.begin').length)
    })

    it('applies inline syntax highlighting classes to diffs', function () {
      assert($('.diff.inserted').length)
      assert($('.diff.deleted').length)
    })

    it('does not encode entities within code blocks', function () {
      assert(~fixtures.enterprise.indexOf('"name": "@myco/anypackage"'))
      var $ = marky(fixtures.enterprise)
      assert(!~$.html().indexOf('<span>quot</span>'))
      assert(~$.html().indexOf('<span>&quot;</span>'))
    })
  })

  it('does not convert mustache template variables in markdown', function () {
    assert(~fixtures.basic.indexOf('{{template}}'))
    assert(~fixtures.basic.indexOf('{{do.not.replace}}'))
    var $ = marky(fixtures.basic)
    assert(~$.html().indexOf('{{template}}'))
    assert(~$.html().indexOf('{{do.not.replace}}'))
  })

  it('does not convert mustache template variables in fenced code blocks with highlighting on', function () {
    assert(~fixtures.basic.indexOf('{{name.lastName}}'))
    assert(~fixtures.basic.indexOf('{{name.firstName}}'))
    assert(~fixtures.basic.indexOf('{{name.suffix}}'))
    var $ = marky(fixtures.basic, {highlightSyntax: true})
    assert(~$.html().indexOf('{{name.lastName}}'))
    assert(~$.html().indexOf('{{name.firstName}}'))
    assert(~$.html().indexOf('{{name.suffix}}'))
  })

  it('does not convert mustache template variables in fenced code blocks with highlighting off', function () {
    assert(~fixtures.basic.indexOf('{{name.lastName}}'))
    assert(~fixtures.basic.indexOf('{{name.firstName}}'))
    assert(~fixtures.basic.indexOf('{{name.suffix}}'))
    var $ = marky(fixtures.basic, {highlightSyntax: false})
    assert(~$.html().indexOf('{{name.lastName}}'))
    assert(~$.html().indexOf('{{name.firstName}}'))
    assert(~$.html().indexOf('{{name.suffix}}'))
  })
})
