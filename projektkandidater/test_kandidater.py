"""
Test för hamta_vindbrukskollen.py. Körs utan nätverk, med påhittade verk:
  python -m unittest test_kandidater -v
"""
import unittest

import hamta_vindbrukskollen as h


def verk(omrid, nr, mw=6.0, gwh=21.0, status_namn='Handläggs', plats='Land', kommun='Testköping', hojd=250, **extra):
    p = {'VERKID': '%s-%03d' % (omrid, nr), 'OMRID': omrid, 'PROJNAMN': 'Provparken', 'STATUS': status_namn,
         'TOTALHOJD': hojd, 'NAVHOJD': 160, 'ROTDIAMETER': 170, 'MAXEFFEKT': mw, 'CALPROD': gwh,
         'ORGNAMN': 'Prov AB', 'PLACERING': plats, 'KOMNAMN': kommun, 'LANSNAMN': 'Provlän', 'EL_NAMN': 'Malmö',
         'SenasteUppdatering': 1_750_000_000_000, 'E': 400000.0, 'N': 6300000.0}
    p.update(extra)
    return p


class SlaIhop(unittest.TestCase):
    def test_effekt_produktion_och_fullasttimmar(self):
        o = h.sla_ihop({'Handlaggs': [verk('A', i) for i in range(1, 11)]})[0]
        self.assertEqual(o['verk'], 10)
        self.assertAlmostEqual(o['mw'], 60.0)
        self.assertAlmostEqual(o['gwh_ar'], 210.0)
        self.assertAlmostEqual(o['fullasttimmar'], 3500.0)            # 210 GWh * 1000 / 60 MW
        self.assertAlmostEqual(o['kapacitetsfaktor'], 3500 / 8760)
        self.assertEqual(o['elomrade'], 'SE4')                         # Malmö är elområde 4
        self.assertEqual(o['status'], 'Handläggs 10')

    def test_effekt_som_saknar_varde_ger_ingen_summa(self):
        poster = [verk('A', 1), verk('A', 2, mw=None)]
        o = h.sla_ihop({'Handlaggs': poster})[0]
        self.assertIsNone(o['mw'])
        self.assertIsNone(o['fullasttimmar'])

    def test_blandad_status_i_ett_omrade(self):
        o = h.sla_ihop({'Beviljat': [verk('A', 1)], 'Handlaggs': [verk('A', 2)]})[0]
        self.assertEqual(o['verk'], 2)
        self.assertEqual(sorted(o['status_lista']), ['Beviljat', 'Handlaggs'])


class ValjKandidater(unittest.TestCase):
    def omraden(self):
        return h.sla_ihop({'Handlaggs': (
            [verk('STOR', i) for i in range(1, 9)]                                   # 8 verk, 48 MW: med
            + [verk('LITEN', i) for i in range(1, 3)]                                # 2 verk: för få
            + [verk('UTANEFFEKT', i, mw=None) for i in range(1, 9)]                  # effekt saknas
            + [verk('HAV', i, plats='Vatten') for i in range(1, 9)]                  # till havs
            + [verk('GAMMAL', i, SenasteUppdatering=1_400_000_000_000) for i in range(1, 9)]  # senast uppdaterad 2014
        )})

    def test_urvalet(self):
        k = h.valj_kandidater(self.omraden(), min_verk=5, min_mw=30, senast_uppdaterad='2024-01-01')
        self.assertEqual([o['omrid'] for o in k], ['STOR'])

    def test_utan_effekt_hittas_separat(self):
        u = h.utan_effekt(self.omraden(), min_verk=5, senast_uppdaterad='2024-01-01')
        self.assertEqual([o['omrid'] for o in u], ['UTANEFFEKT'])

    def test_uppforda_ar_inte_aktuella(self):
        om = h.sla_ihop({'Uppfort': [verk('UPP', i, status_namn='Uppfört') for i in range(1, 9)]})
        self.assertEqual(h.valj_kandidater(om, 5, 30, '2024-01-01'), [])


class Avvikande(unittest.TestCase):
    def test_ligger_utanfor_spannet(self):
        ref = {'q1': 2500, 'q3': 3100, 'median': 2800, 'antal': 100}
        self.assertFalse(h.avvikande(2900, ref))
        self.assertTrue(h.avvikande(998, ref))      # Markbygdens registrerade produktion
        self.assertTrue(h.avvikande(4300, ref))
        self.assertFalse(h.avvikande(None, ref))


if __name__ == '__main__':
    unittest.main()
