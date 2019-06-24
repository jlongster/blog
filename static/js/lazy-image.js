;(function() {
  let images = document.querySelectorAll('.lazy-image')

  function onViewNode(node, func) {
    var options = {
      root: null,
      rootMargin: '0px 100%',
      threshold: 0.5
    }

    var observer = new IntersectionObserver((entries, observer) => {
      if (entries.length > 0 && entries[0].intersectionRatio > 0) {
        func()
        observer.disconnect()
      }
    }, options)

    observer.observe(node)

    return () => observer.disconnect()
  }

  images.forEach(el => {
    let rect = el.getBoundingClientRect()
    let width = parseInt(el.dataset.width)
    let height = parseInt(el.dataset.height)

    el.style.width = rect.width + 'px'
    el.style.height = Math.min(rect.width / width, 1) * height + 'px'

    onViewNode(el, () => {
      let img = el.querySelector('.lazy-image-content')

      img.addEventListener('load', () => {
        el.replaceWith(img)
        img.style.display = 'initial'
        img.style.opacity = 0
        img.style.transition = 'opacity .5s'

        setTimeout(() => {
          img.style.opacity = 1
        }, 100)
      })

      img.src = el.dataset.src
    })
  })
})()
