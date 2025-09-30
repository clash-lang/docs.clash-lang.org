// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded affix "><a href="index.html">Clash User Guide</a></li><li class="chapter-item expanded "><div><strong aria-hidden="true">1.</strong> Getting Started</div></li><li><ol class="section"><li class="chapter-item expanded "><a href="getting-started/installing.html"><strong aria-hidden="true">1.1.</strong> Installing</a></li></ol></li><li class="chapter-item expanded "><a href="general/index.html"><strong aria-hidden="true">2.</strong> General</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="general/relnotes.html"><strong aria-hidden="true">2.1.</strong> Release Notes</a></li><li class="chapter-item expanded "><a href="general/faqs.html"><strong aria-hidden="true">2.2.</strong> FAQs</a></li><li class="chapter-item expanded "><a href="general/license.html"><strong aria-hidden="true">2.3.</strong> License</a></li></ol></li><li class="chapter-item expanded "><div><strong aria-hidden="true">3.</strong> Developing Hardware</div></li><li><ol class="section"><li class="chapter-item expanded "><a href="developing-hardware/language.html"><strong aria-hidden="true">3.1.</strong> Language</a></li><li class="chapter-item expanded "><a href="developing-hardware/prelude.html"><strong aria-hidden="true">3.2.</strong> Prelude</a></li><li class="chapter-item expanded "><a href="developing-hardware/flags.html"><strong aria-hidden="true">3.3.</strong> Flags</a></li><li class="chapter-item expanded "><a href="developing-hardware/annotations.html"><strong aria-hidden="true">3.4.</strong> Controlling HDL generation</a></li><li class="chapter-item expanded "><a href="developing-hardware/primitives.html"><strong aria-hidden="true">3.5.</strong> User-defined primitives</a></li><li class="chapter-item expanded "><a href="developing-hardware/troubleshooting.html"><strong aria-hidden="true">3.6.</strong> Troubleshooting</a></li><li class="chapter-item expanded "><a href="developing-hardware/limitations.html"><strong aria-hidden="true">3.7.</strong> Limitations of the compiler</a></li></ol></li><li class="chapter-item expanded "><a href="hacking-on-clash/index.html"><strong aria-hidden="true">4.</strong> Hacking on Clash</a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0].split("?")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
