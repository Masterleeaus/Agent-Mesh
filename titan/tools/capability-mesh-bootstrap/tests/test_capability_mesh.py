import importlib.util, pathlib
P=pathlib.Path(__file__).parents[1]/'tools'/'capability_mesh.py'
spec=importlib.util.spec_from_file_location('cm',P); cm=importlib.util.module_from_spec(spec); spec.loader.exec_module(cm)

def test_next_requires_unclaimed_and_dependencies():
    tasks=[
      {'task_id':'A','status':'VERIFIED','priority':1,'dependencies':[],'claim':{'status':'RELEASED'}},
      {'task_id':'B','status':'PROPOSED','priority':10,'dependencies':['A'],'claim':{'status':'UNCLAIMED'}},
      {'task_id':'C','status':'PROPOSED','priority':20,'dependencies':['B'],'claim':{'status':'UNCLAIMED'}}]
    assert cm.choose_next(tasks)['task_id']=='B'

def test_impacted_reverse_dependency():
    g={'edges':[{'from':'B','to':'A','type':'DEPENDS_ON'},{'from':'C','to':'B','type':'DEPENDS_ON'}]}
    assert cm.impacted(g,['A'])==['B','C']

def test_verified_requires_independent_verifier():
    ev=[{'result':'PASS','producer_role':'BUILDER','producer_id':'x'}]
    assert not cm.can_mark_verified(ev,'x')
    ev.append({'result':'PASS','producer_role':'VERIFIER','producer_id':'y'})
    assert cm.can_mark_verified(ev,'x')

def test_summary():
    s=cm.summary({'capabilities':[{'capability_id':'x','status':'IMPLEMENTED'}]})
    assert s['capabilities']==1 and s['status_counts']['IMPLEMENTED']==1
