from django.db import migrations


def copy_category_to_categories(apps, schema_editor):
    Product = apps.get_model('store', 'Product')
    for product in Product.objects.all():
        if product.category_id:
            product.categories.add(product.category_id)


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0004_product_categories'),
    ]

    operations = [
        migrations.RunPython(copy_category_to_categories),
    ]
