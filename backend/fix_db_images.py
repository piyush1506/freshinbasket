import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freshinbasket_core.settings')
django.setup()

from store.models import Product, Category, Section, Slide, SubProduct


def clean_url_field(val):
    if not val:
        return val
    s = str(val).strip()
    if s.count('https://') > 1 or s.count('http://') > 1 or '/media/http' in s:
        last_http = max(s.rfind('https://'), s.rfind('http://'))
        if last_http > 0:
            s = s[last_http:]
    if s.startswith('http://res.cloudinary.com'):
        s = s.replace('http://', 'https://')
    return s


def main():
    print("Starting database image URL cleanup...")
    total_fixed = 0

    # 1. Products
    products = Product.objects.all()
    p_count = 0
    for p in products:
        if p.image_url:
            cleaned = clean_url_field(str(p.image_url))
            if cleaned != str(p.image_url):
                p.image_url = cleaned
                p.save(update_fields=['image_url'])
                p_count += 1
                total_fixed += 1
    print(f"Fixed {p_count} Product images.")

    # 2. Categories
    categories = Category.objects.all()
    c_count = 0
    for c in categories:
        if c.image:
            cleaned = clean_url_field(str(c.image))
            if cleaned != str(c.image):
                c.image = cleaned
                c.save(update_fields=['image'])
                c_count += 1
                total_fixed += 1
    print(f"Fixed {c_count} Category images.")

    # 3. Sections
    sections = Section.objects.all()
    s_count = 0
    for s in sections:
        if s.image:
            cleaned = clean_url_field(str(s.image))
            if cleaned != str(s.image):
                s.image = cleaned
                s.save(update_fields=['image'])
                s_count += 1
                total_fixed += 1
    print(f"Fixed {s_count} Section images.")

    # 4. Slides
    try:
        slides = Slide.objects.all()
        sl_count = 0
        for sl in slides:
            if hasattr(sl, 'image') and sl.image:
                cleaned = clean_url_field(str(sl.image))
                if cleaned != str(sl.image):
                    sl.image = cleaned
                    sl.save(update_fields=['image'])
                    sl_count += 1
                    total_fixed += 1
        print(f"Fixed {sl_count} Slide images.")
    except Exception as e:
        print(f"Slide cleanup skipped: {e}")

    print(f"\nCleanup complete! Total images fixed: {total_fixed}")


if __name__ == '__main__':
    main()
