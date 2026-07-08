
import os
import django


os.environ.setdefault('DJANGO_SETTINGS_MODULE','freshinbasket_core.settings')
django.setup()


from store.models import Category, Product, Section
from users.models import User

def seed_data():
    admin_user = User.objects.filter(username='admin').first()
    if admin_user:
        admin_user.role = User.Role.ADMIN
        admin_user.save()
        print(f"updated user {admin_user.username} to ADMIN role")

    # Create a default Section to contain the categories
    section, created = Section.objects.get_or_create(
        slug='fresh-groceries',
        defaults={
            'name': 'Fresh Groceries',
            'description': 'Daily essentials and fresh greens',
            'icon': '🥬',
            'is_active': True
        }
    )
    if created:
        print(f"created section: {section.name}")
    else:
        print(f"section already exists: {section.name}")

    categories = [
        {'name':'Fruits','slug':'fruits','description':'fresh and organic fruits'},
        {'name':'Vegetables','slug':'vegetables','description':'fresh and organic vegetables'},
        {'name':'Root Vegetables','slug':'root-vegetables','description':'hearty root vegetables'},
        {'name':'Fresh Vegetables','slug':'fresh-vegetables','description':'daily fresh vegetables'},
        {'name':'Seasonal Vegetables','slug':'seasonal-vegetables','description':'in-season vegetables'},
    ]

    for cat_data in categories:
        category,created = Category.objects.get_or_create(
            slug=cat_data['slug'],
            defaults={'name':cat_data['name'],'description':cat_data['description'], 'section': section}
        )
        if not created:
            category.section = section
            category.save()
            print(f"linked category: {category.name} to section: {section.name}")
        else:
            print(f"created category:{category.name}")

    fruits_cat = Category.objects.get(slug='fruits')
    veggies_cat = Category.objects.get(slug='vegetables')
    root_veg = Category.objects.get(slug='root-vegetables')
    fresh_veg = Category.objects.get(slug='fresh-vegetables')
    seasonal_veg = Category.objects.get(slug='seasonal-vegetables')



    # Products
    products = [
        {'categories':[fruits_cat],
        'name':'Apple',
        'slug':'apple',
        'description':'crispy red apples',
        'price':80,
        'stock':100,
        'image_url':'/fruits/apple.jpg'
        },
         {'categories':[fruits_cat],
        'name':'Banana',
        'slug':'banana',
        'description':'crispy red banana',
        'price':40,
        'stock':300,
        'image_url':'/fruits/banana.jpg'
        },
         {'categories':[veggies_cat, root_veg, fresh_veg, seasonal_veg],
        'name':'Carrot',
        'slug':'carrot',
        'description':'crispy red carrot',
        'price':30,
        'stock':200,
        'image_url':'/vegetables/carrot.jpg'
        }
    ]

    for prod_data in products:
        prod_categories = prod_data.pop('categories', [])
        product,created = Product.objects.get_or_create(
            slug=prod_data['slug'],
            defaults=prod_data
        )
        product.categories.set(prod_categories)
        if created:
            print(f"created product: {product.name}")
        else:
            print(f"updated product: {product.name}")

if __name__ == '__main__':
    seed_data()
